// Pure helpers shared by the service worker, the options page, and the tests.
// No DOM, no chrome.* — keep it import-safe for `node --test`.

// Brief on purpose: let Gemini pick the structure — it reads better than a
// heavily prescribed format. Edit it in the options page.
export const DEFAULT_PROMPT = `Summarize the video:`;

// YouTube video ids are exactly 11 url-safe chars.
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

// Return the canonical https://www.youtube.com/watch?v=ID for any YouTube video
// URL (watch, youtu.be, shorts, live, embed, m./music.). Returns null for
// anything that isn't a single YouTube video (channels, feeds, other sites).
export function canonicalizeYouTubeUrl(urlString) {
  let url;
  try {
    url = new URL(urlString);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '');
  let id = null;

  if (host === 'youtu.be') {
    id = url.pathname.slice(1).split('/')[0];
  } else if (
    host === 'youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'music.youtube.com'
  ) {
    if (url.pathname === '/watch') {
      id = url.searchParams.get('v');
    } else {
      const m = url.pathname.match(/^\/(?:shorts|live|embed|v)\/([^/?#]+)/);
      if (m) id = m[1];
    }
  } else {
    return null;
  }

  if (id && VIDEO_ID.test(id)) {
    return `https://www.youtube.com/watch?v=${id}`;
  }
  return null;
}

// Clean a browser tab title into a video title: drop the leading "(3) " unread
// count YouTube adds and the trailing " - YouTube".
export function stripTitle(title) {
  return (title || '')
    .replace(/^\(\d+\)\s*/, '')
    .replace(/\s*-\s*YouTube\s*$/, '')
    .trim();
}

// Build the full Gemini prompt. The video title + link are always appended so
// the user's saved instructions never have to remember them.
export function buildPrompt(instructions, title, url) {
  const body = (instructions || DEFAULT_PROMPT).trim();
  const tail = title ? `${title}\n${url}` : url;
  return `${body}\n\n${tail}`;
}
