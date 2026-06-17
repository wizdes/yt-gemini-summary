// Pure helpers shared by the service worker, the options page, and the tests.
// No DOM, no chrome.* — keep it import-safe for `node --test`.

export const DEFAULT_PROMPT = `Summarize this YouTube video for me.

Give me:
1. A one-sentence TL;DR.
2. The key points as 5-10 bullets, in the order they're presented.
3. Any actionable steps, tips, or takeaways.
4. Notable quotes, numbers, or claims worth remembering.

Be concise, skip filler, and preserve step order for tutorials. Use the video
itself if you can access it; otherwise use its transcript and title.`;

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
  const label = title ? `Video: ${title}\n${url}` : url;
  return `${body}\n\n${label}`;
}
