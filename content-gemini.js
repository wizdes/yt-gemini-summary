// Runs on gemini.google.com. If the service worker stashed a prompt, type it
// into Gemini's input and hit send. If Gemini's DOM has changed and we can't
// find the box, fall back to a copy-and-paste toast so it never fails silently.
(() => {
  const PENDING_KEY = 'pendingGeminiPrompt';
  const MAX_AGE_MS = 10 * 60 * 1000; // ignore a stash older than 10 min

  // Ordered fallbacks: first match wins, so one Google rename doesn't kill it.
  const EDITOR_SELECTORS = [
    'rich-textarea .ql-editor[contenteditable="true"]',
    '.ql-editor[contenteditable="true"]',
    'div[contenteditable="true"][role="textbox"]',
    'div[contenteditable="true"]',
    'textarea',
  ];
  const SEND_SELECTORS = [
    'button.send-button',
    'button[aria-label*="send" i]',
    'button[mattooltip*="send" i]',
    'button[data-test-id="send-button"]',
  ];

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const isVisible = (el) => !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));

  function findFirst(selectors, { mustBeEnabled = false } = {}) {
    for (const sel of selectors) {
      for (const el of document.querySelectorAll(sel)) {
        if (!isVisible(el)) continue;
        if (mustBeEnabled && (el.disabled || el.getAttribute('aria-disabled') === 'true')) continue;
        return el;
      }
    }
    return null;
  }

  async function waitFor(selectors, timeoutMs, opts) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const el = findFirst(selectors, opts);
      if (el) return el;
      await sleep(200);
    }
    return null;
  }

  function fillEditor(editor, text) {
    editor.focus();
    if (editor.tagName === 'TEXTAREA') {
      editor.value = text;
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    // contenteditable: execCommand keeps frameworks (Quill) in sync best.
    try {
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, text);
    } catch {
      /* fall through */
    }
    if (!editor.textContent || !editor.textContent.trim()) {
      editor.textContent = text;
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' }));
    }
  }

  function clickEl(el) {
    el.click();
    // Belt and suspenders for Material buttons that want real pointer events.
    for (const type of ['pointerdown', 'mousedown', 'mouseup', 'pointerup']) {
      el.dispatchEvent(new MouseEvent(type, { bubbles: true }));
    }
  }

  function showFallbackToast(prompt) {
    if (document.getElementById('ytgs-toast')) return;
    const box = document.createElement('div');
    box.id = 'ytgs-toast';
    box.style.cssText = [
      'position:fixed', 'right:16px', 'bottom:16px', 'z-index:2147483647',
      'width:340px', 'max-width:calc(100vw - 32px)', 'background:#1f1f1f',
      'color:#fff', 'border:1px solid #444', 'border-radius:12px', 'padding:14px',
      'box-shadow:0 8px 28px rgba(0,0,0,.45)', 'font:13px/1.4 system-ui,sans-serif',
    ].join(';');
    box.innerHTML =
      '<div style="font-weight:600;margin-bottom:6px">Could not auto-fill Gemini</div>' +
      '<div style="opacity:.85;margin-bottom:8px">Copy this prompt and paste it (Cmd/Ctrl+V).</div>';
    const ta = document.createElement('textarea');
    ta.readOnly = true;
    ta.value = prompt;
    ta.style.cssText = 'width:100%;height:90px;resize:vertical;border-radius:8px;border:1px solid #555;background:#111;color:#eee;padding:8px;box-sizing:border-box';
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;margin-top:8px;justify-content:flex-end';
    const copy = document.createElement('button');
    copy.textContent = 'Copy';
    const dismiss = document.createElement('button');
    dismiss.textContent = 'Dismiss';
    for (const b of [copy, dismiss]) {
      b.style.cssText = 'padding:6px 12px;border-radius:8px;border:0;cursor:pointer;font:inherit';
    }
    copy.style.background = '#8ab4f8';
    copy.style.color = '#202124';
    dismiss.style.background = '#3c3c3c';
    dismiss.style.color = '#fff';
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(prompt); // user gesture → allowed
        copy.textContent = 'Copied ✓';
      } catch {
        ta.focus();
        ta.select();
        document.execCommand('copy');
        copy.textContent = 'Copied ✓';
      }
    });
    dismiss.addEventListener('click', () => box.remove());
    row.append(copy, dismiss);
    box.append(ta, row);
    document.body.appendChild(box);
  }

  async function run() {
    const data = await chrome.storage.session.get(PENDING_KEY);
    const pending = data[PENDING_KEY];
    if (!pending) return;
    if (Date.now() - pending.ts > MAX_AGE_MS) {
      await chrome.storage.session.remove(PENDING_KEY);
      return;
    }

    const editor = await waitFor(EDITOR_SELECTORS, 20000);
    if (!editor) {
      // No editor on a /app page means the selectors broke → show the fallback.
      // On a login/loading page, leave the stash so the post-login load retries.
      if (location.pathname.startsWith('/app')) {
        await chrome.storage.session.remove(PENDING_KEY);
        showFallbackToast(pending.prompt);
      }
      return;
    }

    // Claim it now (editor only exists on the real app page) so a second Gemini
    // tab can't re-send the same prompt.
    await chrome.storage.session.remove(PENDING_KEY);

    try {
      fillEditor(editor, pending.prompt);
      const send = await waitFor(SEND_SELECTORS, 8000, { mustBeEnabled: true });
      if (send) {
        clickEl(send);
      } else {
        showFallbackToast(pending.prompt); // filled but couldn't find send
      }
    } catch {
      showFallbackToast(pending.prompt);
    }
  }

  run().catch(() => {});
})();
