# YouTube Summary with Gemini

A tiny, open-source Chrome extension (Manifest V3). While you're watching a
YouTube video, click the toolbar button — it opens **Gemini** with a summary
prompt already filled in and sent, including the video's title and link.

The default prompt is intentionally short so Gemini picks a good structure; you
can edit it any time in the options page.

## Install (load unpacked)

The extension isn't on the Chrome Web Store yet, so install it from source:

1. Download or clone this repository.
2. Open `chrome://extensions`.
3. Turn on **Developer mode** (top-right).
4. Click **Load unpacked** and select the project folder.
5. Pin the extension (puzzle 🧩 icon → pin) so the toolbar button is visible.

You must be **signed into Gemini** in the same browser for auto-fill to work.

> The icons are committed, so there's nothing to build. If you ever need to
> regenerate them, run `python3 tools/make_icons.py` (standard library only).

## Use

- On a YouTube video, the toolbar icon shows a small **green dot** in the
  corner — that means it's ready. Click it: a Gemini tab opens, the prompt is
  typed in and submitted, and the summary starts generating.
- Not on a YouTube video? No green dot — clicking shows a brief `YT?` badge and
  does nothing.
- **Edit the prompt:** right-click the icon → **Options** (or `chrome://extensions`
  → Details → Extension options). The video's title and link are appended
  automatically, so your prompt never needs to mention them.

## How it works

- `content-youtube.js` runs on YouTube and reports the page URL to the service
  worker (on load and on YouTube's in-app navigations). The worker swaps the
  toolbar icon to the green-dot variant when you're on a video.
- `background.js` (service worker) reads the active tab's URL on click,
  canonicalizes it to `https://www.youtube.com/watch?v=ID`, builds the prompt,
  stashes it in `chrome.storage.session`, and opens Gemini.
- `content-gemini.js` runs on Gemini, reads the stashed prompt, types it into the
  input box, and clicks send.

### The one fragile part

Gemini's web app has no official "prefill" URL, so auto-fill works by typing into
Gemini's input element directly — and Google can change that DOM without notice.
The content script uses **ordered fallback selectors**, and if it still can't find
the box it shows a **copy-and-paste toast** with the prompt. It degrades; it never
fails silently. If auto-fill ever stops working, update `EDITOR_SELECTORS` /
`SEND_SELECTORS` in `content-gemini.js`.

## Limitations

- Gemini can only watch **public** videos; private/unlisted ones fall back to the
  title and transcript if available.
- Requires being signed into Gemini with YouTube access enabled on the account.

## Develop

```bash
npm test                      # run the unit tests (node --test over test/)
python3 tools/make_icons.py   # regenerate the icons
```

`lib.js` holds the pure, testable logic (URL canonicalization, prompt building,
the default prompt) and is shared by the service worker, the options page, and the
tests.

## Package for distribution

```bash
bash tools/pack.sh
```

Produces, in `dist/` (gitignored):

- `yt-gemini-summary.zip` — upload to the Chrome Web Store (manifest at the zip
  root, runtime files only).
- `yt-gemini-summary.crx` — a signed package for self-distribution.

The first run creates `key.pem` (the signing key) and reuses it afterward, so the
extension ID stays stable across rebuilds. `key.pem`, `dist/`, and `*.crx` are
gitignored — **never commit the key.** Note: Chrome blocks `.crx` files installed
outside the Web Store for normal users, so for everyday use either load unpacked
or publish to the Web Store with the `.zip`.

## License

MIT — see [LICENSE](LICENSE).
