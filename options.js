import { DEFAULT_PROMPT } from './lib.js';

const $prompt = document.getElementById('prompt');
const $status = document.getElementById('status');

function flash(msg) {
  $status.textContent = msg;
  setTimeout(() => {
    if ($status.textContent === msg) $status.textContent = '';
  }, 2000);
}

async function load() {
  const { instructions } = await chrome.storage.sync.get('instructions');
  $prompt.value = instructions || DEFAULT_PROMPT;
}

document.getElementById('save').addEventListener('click', async () => {
  await chrome.storage.sync.set({ instructions: $prompt.value });
  flash('Saved ✓');
});

document.getElementById('reset').addEventListener('click', async () => {
  $prompt.value = DEFAULT_PROMPT;
  await chrome.storage.sync.set({ instructions: DEFAULT_PROMPT });
  flash('Reset to default');
});

load();
