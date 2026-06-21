# Chrome Web Store listing — YouTube Summary with Gemini

Everything needed for the developer-console listing. Copy/paste the text; upload the
images from `store-assets/images/`. Regenerate images with `npm run store-assets`.

---

## Product details

**Item name**
```
YouTube Summary with Gemini: Open Source One-Click Summarizer
```

**Summary** (short description, max 132 chars — this one is 123)
```
One click summarizes the YouTube video you're watching in Gemini. Editable prompt, copy fallback, no tracking. Open source.
```

**Description** (detailed)
```
Watching a long YouTube video and want the gist first? YouTube Summary with Gemini adds one toolbar button: click it on any YouTube video and Gemini opens in a new tab with a summary prompt already filled in and sent — the video's title and link are added for you automatically.

That's the whole product. No dashboards, no accounts to create, no servers in the middle. You stay in your own Gemini session the entire time.

WHY YOU'LL LIKE IT
- One click: on any YouTube video, click the toolbar button and Gemini starts summarizing — title and link attached automatically.
- A green "ready" dot on the toolbar icon tells you at a glance when you're on a video the extension can summarize.
- Fully editable prompt: the default is a short "Summarize the video:" so Gemini picks a good structure, but you can rewrite it to analyze, critique, pull action items, or ask your own questions. Edit it any time on the options page.
- Never stuck: Gemini has no official prefill URL, so auto-fill types into Gemini's input directly. If Google changes that page, the extension falls back to a copy-to-clipboard toast with your prompt — it degrades, it never fails silently.
- Private by design: no analytics, no tracking, no ads, no data sent to the developer. The only thing transmitted is the prompt you send to your own Gemini session.
- Featherweight: vanilla HTML/CSS/JS, Manifest V3, no frameworks, no background polling.

HOW IT WORKS
On a YouTube video the extension reads the page URL and title only when you click. It builds your prompt (your instructions + the video's title and link), opens Gemini in a new tab, types the prompt into Gemini's input box, and sends it. Everything happens in your browser, in your signed-in Gemini session.

OPEN SOURCE (MIT)
YouTube Summary with Gemini is fully open source under the MIT license. Read the code, file an issue, or contribute:
https://github.com/wizdes/yt-gemini-summary

GETTING STARTED
1) Install and pin the extension (puzzle icon → pin) so the toolbar button is visible.
2) Sign in to Gemini in the same browser.
3) Open any YouTube video and click the button. That's it.

Tip: want a different prompt? Right-click the icon → Options.

Made by Yi Li · https://yili.dev/projects/youtube_summary_with_gemini/
```

**Category:** Workflow & Planning
**Language:** English (United States)

---

## Privacy

**Single purpose**
```
On one click, summarize the YouTube video you are currently watching by opening Google Gemini and auto-filling a summary prompt with the video's title and link.
```

**Permission justifications**
- `storage` —
  ```
  Saves your editable summary prompt so it persists between sessions, and holds a short-lived session handoff (the built prompt) so the Gemini tab can read it after it opens. Nothing is sent to the developer.
  ```
- `activeTab` —
  ```
  When you click the toolbar button, reads only the current tab's URL and title to identify the YouTube video being summarized. No access to other tabs or to the page until you click.
  ```
- `clipboardWrite` —
  ```
  Powers the copy-to-clipboard fallback: if Gemini's page layout changes and the prompt can't be auto-filled, the extension copies the prompt so you can paste it yourself instead of being stuck.
  ```
- Host permission `https://www.youtube.com/*`, `https://m.youtube.com/*` —
  ```
  Detects when you are on a YouTube video so the toolbar icon can show the green "ready" dot and read the video's URL and title on click.
  ```
- Host permission `https://gemini.google.com/*` —
  ```
  Fills the summary prompt into Gemini's input box and submits it in your own signed-in Gemini session — the core function of the extension.
  ```
- Remote code: **No.**

**Data usage / certifications** — the extension does **not** collect or transmit any of the
disclosable data categories to the developer or any third party (no PII, location, financial,
authentication, web history, user activity, or website-content collection). The only "transmission"
is functional: the current video's title and link are placed into **your own** Gemini prompt, which
you send to Google Gemini in your own session — that is the core feature, not data collection. Your
saved prompt stays on your device. Certify all three: data is **not sold**, **not used for unrelated
purposes**, and **not used for creditworthiness/lending**.

**Privacy policy URL**
```
https://github.com/wizdes/yt-gemini-summary/blob/main/PRIVACY.md
```

---

## URLs

| Field | Value |
|-------|-------|
| Official / website URL | https://yili.dev/projects/youtube_summary_with_gemini/ |
| Homepage URL | https://github.com/wizdes/yt-gemini-summary |
| Support URL | https://github.com/wizdes/yt-gemini-summary/issues |
| Privacy policy URL | https://github.com/wizdes/yt-gemini-summary/blob/main/PRIVACY.md |

---

## Images (in `store-assets/images/`)

| Field | File | Size |
|-------|------|------|
| Store icon | `store-icon-128.png` | 128×128 |
| Screenshot 1 | `screenshot-1-hero.png` — "Summarize any YouTube video in one click" (mock flow) | 1280×800 |
| Screenshot 2 | `screenshot-2-welcome.png` — "Set up in seconds" (real welcome page) | 1280×800 |
| Screenshot 3 | `screenshot-3-options.png` — "Your prompt, your way" (real options page) | 1280×800 |
| Screenshot 4 | `screenshot-4-ready.png` — "A green dot when you're ready" (icon states) | 1280×800 |
| Screenshot 5 | `screenshot-5-open-source.png` — "Free & open source" | 1280×800 |
| Small promo tile | `promo-small-440x280.jpg` | 440×280 |
| Marquee promo tile | `promo-marquee-1400x560.jpg` | 1400×560 |
