// Service worker (module). On toolbar click: if the active tab is a YouTube
// video, build the prompt, stash it, and open Gemini. The content script picks
// it up there.
import { canonicalizeYouTubeUrl, stripTitle, buildPrompt, DEFAULT_PROMPT } from './lib.js';

const PENDING_KEY = 'pendingGeminiPrompt';

// session storage is TRUSTED_CONTEXTS-only by default; the content script runs
// in an untrusted context, so widen access or it can't read the prompt.
async function ensureSessionAccess() {
  try {
    await chrome.storage.session.setAccessLevel({
      accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
    });
  } catch {
    // Older Chrome without setAccessLevel — content script still reads in many
    // builds; the clipboard fallback covers the rest.
  }
}
ensureSessionAccess();
chrome.runtime.onInstalled.addListener(ensureSessionAccess);
chrome.runtime.onStartup?.addListener(ensureSessionAccess);

async function flashBadge(tabId, text) {
  try {
    await chrome.action.setBadgeBackgroundColor({ tabId, color: '#E62117' });
    await chrome.action.setBadgeText({ tabId, text });
    setTimeout(() => chrome.action.setBadgeText({ tabId, text: '' }).catch(() => {}), 2500);
  } catch {
    // tab may be gone; ignore.
  }
}

// Green "ready, click me" badge on the toolbar icon for the tabs that are on a
// YouTube video. Badge state is per-tab, so it only shows on video tabs.
async function setReadyBadge(tabId, ready) {
  try {
    if (ready) {
      await chrome.action.setBadgeBackgroundColor({ tabId, color: '#1e8e3e' });
      // Same text + background colour renders as a solid green dot.
      if (chrome.action.setBadgeTextColor) {
        await chrome.action.setBadgeTextColor({ tabId, color: '#1e8e3e' });
      }
      await chrome.action.setBadgeText({ tabId, text: '●' });
    } else {
      await chrome.action.setBadgeText({ tabId, text: '' });
    }
  } catch {
    // tab gone; ignore.
  }
}

// The YouTube content script reports the current URL; light the badge when it's
// a video we can summarize.
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type === 'YT_URL' && sender.tab?.id != null) {
    setReadyBadge(sender.tab.id, !!canonicalizeYouTubeUrl(msg.url));
  }
});

// First install: Chrome has no API to pin an extension, so open a short page
// that tells the user how to pin it and confirms it's ready.
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') }).catch(() => {});
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  const canonical = canonicalizeYouTubeUrl(tab?.url || '');
  if (!canonical) {
    await flashBadge(tab?.id, 'YT?');
    return;
  }

  const title = stripTitle(tab.title);
  const stored = await chrome.storage.sync.get('instructions');
  const prompt = buildPrompt(stored.instructions || DEFAULT_PROMPT, title, canonical);

  await ensureSessionAccess();
  await chrome.storage.session.set({ [PENDING_KEY]: { prompt, ts: Date.now() } });
  await chrome.tabs.create({ url: 'https://gemini.google.com/app' });
});
