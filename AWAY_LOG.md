# AWAY_LOG — yt-gemini-summary build (2026-06-16, away mode)

Read this first. Built autonomously while you were away. Everything is **local
only** — nothing pushed, nothing deployed.

## What was built
A Manifest V3 Chrome extension: click the toolbar button on a YouTube video →
Gemini opens with a summary prompt auto-filled and sent. Default prompt editable
in the options page. Matches the approved plan (Approach A: auto-fill + clipboard
fallback, auto-send, click = instant + separate options page).

## Verification evidence
- **Unit tests:** `node --test` → 19/19 pass (URL canonicalize for
  watch/youtu.be/shorts/live/embed/m./music. + null cases; title strip; prompt build).
- **Icons:** `tools/make_icons.py` generates 16/48/128 PNGs; verified they decode
  (sips) and render correctly (red rounded square + white play triangle).
- **Live Gemini selector check (the fragile piece):** drove your signed-in Chrome
  against `gemini.google.com/app`. Confirmed:
  - Editor selector `rich-textarea .ql-editor[contenteditable="true"]` matches
    (aria-label "Enter a prompt for Gemini").
  - `execCommand('insertText')` successfully types into it (screenshot captured
    showing the prompt in Gemini's box).
  - Send button: my **first** selector `button.send-button` is STALE — Gemini now
    uses `mdc-icon-button` (aria-label "Send message", icon `arrow_upward`). The
    **second** fallback `button[aria-label*="send" i]` caught it and it was enabled.
    The ordered-fallback design worked as intended; left the stale selector first
    as a harmless cushion in case Google reverts.
  - Did NOT fire a real send (avoided leaving a junk conversation in your account);
    cleared the test text afterward. The true click→summary E2E is queued below.

## Decisions / judgment calls (away-mode log)
1. **Repo name** = `yt-gemini-summary` (kebab; you can rename freely). Placed at
   `/Users/yili/work/Projects/yt-gemini-summary` per your one-repo-per-project layout.
2. **Tool deviation:** used the Chrome automation (claude-in-chrome) to drive your
   real signed-in Chrome for the live selector check, instead of the usual `/browse`
   gate. Reason: `/browse` is headless and not signed into Gemini, so it can't see
   the logged-in editor/send DOM. You explicitly chose "drive your open Chrome" in
   pre-flight. Logged here per away-mode rules.
3. **`package.json` with `"type":"module"`** added so Node treats `lib.js` as ESM
   for the tests. Chrome ignores it; only Node tooling reads it. (First test run
   failed as CommonJS; this fixed it.)
4. **Permissions kept minimal:** `storage`, `activeTab`, `clipboardWrite` +
   host `gemini.google.com`. No `tabs`, no `scripting`, no `notifications` (used an
   action badge + on-page toast instead).
5. **`chrome.storage.session` access widened** to TRUSTED_AND_UNTRUSTED so the
   content script can read the stashed prompt (otherwise it's worker-only).

## Resolved (2026-06-17)
1. **Load-unpacked full E2E** — ✅ verified working by Yi: loaded unpacked, clicked
   the icon on a real video, Gemini opened and produced the summary.
2. **Push** — ✅ pushed to private `github.com/wizdes/yt-gemini-summary`.
3. **Packaging** — added `tools/pack.sh` → `dist/yt-gemini-summary.zip` (Web Store)
   + signed `.crx`; `key.pem` gitignored.

## Open / nice-to-have (not built, v1 out of scope)
- Reuse an existing Gemini tab instead of opening a new one each click.
- Chrome Web Store listing; Firefox port; multiple saved prompt presets.
