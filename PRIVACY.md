# Privacy Policy — YouTube Summary with Gemini

_Last updated: 2026-06-21_

YouTube Summary with Gemini is a Chrome extension (Manifest V3) that, on one click,
summarizes the YouTube video you are watching by opening Google Gemini and
auto-filling a summary prompt. It is built to be private by default.

## What it stores

The extension stores, **locally on your device** via Chrome's `storage` API:

- your editable summary prompt (so it persists between sessions), and
- a short-lived session handoff — the prompt it just built — so the freshly
  opened Gemini tab can read it. This is cleared with your browser session.

That's it. None of this is sent to the developer.

## What it sends — read this carefully

The extension sends **no data to the developer** and contains **no analytics,
telemetry, tracking, or ads**.

The only "transmission" is the core feature itself: when you click the button, the
current video's **title and link** are placed into a prompt that is then typed into
**your own, signed-in Google Gemini session** and submitted — exactly as if you had
typed it yourself. That prompt goes to Google Gemini under your account, governed by
Google's own privacy terms. The extension is not a party to it and keeps no copy on
any server (there is no server).

## What it accesses, and when

- It reads the **current tab's URL and title only when you click** the toolbar
  button (via `activeTab`), to identify the video.
- It detects when you are on a YouTube page so the toolbar icon can show the green
  "ready" dot (host access to youtube.com).
- It fills and submits the prompt on gemini.google.com (host access to that site).
- If Gemini's page layout changes and the prompt can't be auto-filled, it copies the
  prompt to your clipboard (`clipboardWrite`) so you can paste it — that is the only
  use of the clipboard.

## What it does NOT do

- No accounts, logins, or credentials are created or read by the extension.
- No analytics, telemetry, tracking, cookies, fingerprinting, or advertising.
- No data is collected by, or transmitted to, the developer or any third party.
- No data is sold or shared, and none is used for advertising or creditworthiness.
- No remote code: everything that runs is bundled in the extension.

## Open source

The full source code is public and MIT-licensed, so you can verify all of the above:
https://github.com/wizdes/yt-gemini-summary

## Contact

Questions or concerns? Open an issue:
https://github.com/wizdes/yt-gemini-summary/issues
