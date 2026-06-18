# YouTube → Gemini Summary

A tiny Chrome extension (Manifest V3). When you're watching a YouTube video,
click the toolbar button and it opens **Gemini** with a summary prompt already
filled in and sent — including the video's title and link.

Ships with a strong default prompt; you can edit it in the options page.

## Install (load unpacked)

1. Generate the icons once (only needed if `icons/*.png` are missing):
   ```bash
   python3 tools/make_icons.py
   ```
2. Open `chrome://extensions`.
3. Turn on **Developer mode** (top-right).
4. Click **Load unpacked** and select this folder.
5. Pin the extension so the toolbar button is visible.

You must be **signed into Gemini** in the same browser for auto-fill to work.

After install, a welcome tab opens telling you how to **pin** the extension to
your toolbar (Chrome has no API to pin it automatically). Pin it via the puzzle
🧩 icon → the pin next to "YouTube → Gemini Summary".

## Use

- On a YouTube video, the toolbar icon shows a small **green dot** in the corner —
  that means it's ready. Click it → a Gemini tab opens, the prompt is typed in and
  submitted, and the summary starts generating.
- Not on a YouTube video? No green dot; clicking shows a brief `YT?` badge and
  does nothing.
- Edit the prompt: right-click the icon → **Options** (or `chrome://extensions` →
  Details → Extension options). The default is just `Summarize the video:` (kept
  brief so Gemini picks the structure). The video title + link are appended
  automatically, so your prompt never needs to mention them.

## How it works

- `content-youtube.js` runs on YouTube and reports the page URL to the service
  worker (on load and on YouTube's in-app navigations). The worker swaps the
  toolbar icon to the `-on` variant (a small green dot baked into the corner) when
  it's a video, so the "ready" indicator is a subtle circle rather than Chrome's
  big rectangular badge.
- `background.js` (service worker) reads the active tab's URL on click,
  canonicalizes it to `https://www.youtube.com/watch?v=ID`, builds the prompt,
  stashes it in `chrome.storage.session`, and opens `gemini.google.com/app`.
- `content-gemini.js` runs on Gemini, reads the stashed prompt, types it into the
  input box, and clicks send.

The icon is a brain + play triangle (intentionally not a red rounded square, to
avoid looking like the YouTube logo); regenerate it with `python3 tools/make_icons.py`.

### The one fragile part

Gemini's web app has no official "prefill" URL, so auto-fill works by typing into
Gemini's input element directly. Google changes that DOM without notice. The
content script uses **ordered fallback selectors**, and if it still can't find the
box it shows a **copy-and-paste toast** with the prompt — it degrades, it never
fails silently. If auto-fill ever stops working, update `EDITOR_SELECTORS` /
`SEND_SELECTORS` in `content-gemini.js`.

## Limitations

- Gemini can only watch **public** videos; private/unlisted fall back to title +
  transcript if available.
- Requires being signed into Gemini, with YouTube access enabled on the account.

## Develop

```bash
npm test                 # node --test over test/ (pure logic in lib.js)
python3 tools/make_icons.py   # regenerate icons
```

`lib.js` holds the pure, testable logic (URL canonicalization, prompt building,
the default prompt) and is shared by the service worker, the options page, and the
tests.

## Package for distribution

```bash
bash tools/pack.sh
```

Produces (in `dist/`, gitignored):

- `yt-gemini-summary.zip` — upload this to the **Chrome Web Store** (manifest at the
  zip root, runtime files only).
- `yt-gemini-summary.crx` — a **signed package** for self-distribution / sideloading.

The first run creates `key.pem` (the signing key) and reuses it after, so the
extension ID stays stable across rebuilds. `key.pem`, `dist/`, and `*.crx` are
gitignored — **never commit the key.** Note: Chrome blocks `.crx` files installed
outside the Web Store for normal users, so for everyday use either load unpacked or
publish to the Web Store with the `.zip`.
