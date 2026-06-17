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

## Use

- On any YouTube video, click the toolbar button → a Gemini tab opens, the prompt
  is typed in and submitted, and the summary starts generating.
- Not on a YouTube video? The button shows a small `YT?` badge and does nothing.
- Edit the prompt: right-click the icon → **Options** (or `chrome://extensions` →
  Details → Extension options). The video title + link are appended automatically,
  so your prompt never needs to mention them.

## How it works

- `background.js` (service worker) reads the active tab's URL on click,
  canonicalizes it to `https://www.youtube.com/watch?v=ID`, builds the prompt,
  stashes it in `chrome.storage.session`, and opens `gemini.google.com/app`.
- `content-gemini.js` runs on Gemini, reads the stashed prompt, types it into the
  input box, and clicks send.

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
