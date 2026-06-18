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

// Toolbar icon variants: plain, and one with a small green "ready" dot baked in.
// We swap the whole icon per-tab (Chrome's native badge can't be made a subtle
// circle), so the dot only shows on tabs that are on a YouTube video.
const ICON_OFF = { 16: 'icons/icon16.png', 48: 'icons/icon48.png', 128: 'icons/icon128.png' };
const ICON_ON = { 16: 'icons/icon16-on.png', 48: 'icons/icon48-on.png', 128: 'icons/icon128-on.png' };

async function setReadyIcon(tabId, ready) {
  try {
    await chrome.action.setIcon({ tabId, path: ready ? ICON_ON : ICON_OFF });
  } catch {
    // tab gone / icon missing; ignore.
  }
}

// The YouTube content script reports the current URL; show the green dot when
// it's a video we can summarize.
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type === 'YT_URL' && sender.tab?.id != null) {
    setReadyIcon(sender.tab.id, !!canonicalizeYouTubeUrl(msg.url));
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
