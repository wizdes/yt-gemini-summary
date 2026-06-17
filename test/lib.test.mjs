import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalizeYouTubeUrl, stripTitle, buildPrompt, DEFAULT_PROMPT } from '../lib.js';

const ID = 'dQw4w9WgXcQ';
const CANON = `https://www.youtube.com/watch?v=${ID}`;

test('watch url strips extra params', () => {
  assert.equal(canonicalizeYouTubeUrl(`https://www.youtube.com/watch?v=${ID}&t=42s&list=abc`), CANON);
});

test('watch url without www', () => {
  assert.equal(canonicalizeYouTubeUrl(`https://youtube.com/watch?v=${ID}`), CANON);
});

test('youtu.be short link', () => {
  assert.equal(canonicalizeYouTubeUrl(`https://youtu.be/${ID}?si=xyz`), CANON);
});

test('shorts', () => {
  assert.equal(canonicalizeYouTubeUrl(`https://www.youtube.com/shorts/${ID}`), CANON);
});

test('live', () => {
  assert.equal(canonicalizeYouTubeUrl(`https://www.youtube.com/live/${ID}`), CANON);
});

test('embed', () => {
  assert.equal(canonicalizeYouTubeUrl(`https://www.youtube.com/embed/${ID}`), CANON);
});

test('m.youtube watch', () => {
  assert.equal(canonicalizeYouTubeUrl(`https://m.youtube.com/watch?v=${ID}`), CANON);
});

test('music.youtube watch', () => {
  assert.equal(canonicalizeYouTubeUrl(`https://music.youtube.com/watch?v=${ID}`), CANON);
});

test('non-video youtube page returns null', () => {
  assert.equal(canonicalizeYouTubeUrl('https://www.youtube.com/feed/subscriptions'), null);
});

test('watch without v returns null', () => {
  assert.equal(canonicalizeYouTubeUrl('https://www.youtube.com/watch?list=abc'), null);
});

test('malformed id returns null', () => {
  assert.equal(canonicalizeYouTubeUrl('https://www.youtube.com/watch?v=tooShort'), null);
});

test('non-youtube host returns null', () => {
  assert.equal(canonicalizeYouTubeUrl(`https://example.com/watch?v=${ID}`), null);
});

test('garbage input returns null', () => {
  assert.equal(canonicalizeYouTubeUrl('not a url'), null);
});

test('stripTitle removes trailing - YouTube', () => {
  assert.equal(stripTitle('Great Talk - YouTube'), 'Great Talk');
});

test('stripTitle removes leading unread count', () => {
  assert.equal(stripTitle('(3) Great Talk - YouTube'), 'Great Talk');
});

test('stripTitle leaves a clean title alone', () => {
  assert.equal(stripTitle('Just A Title'), 'Just A Title');
});

test('buildPrompt appends title and url', () => {
  const out = buildPrompt('Summarize.', 'My Video', CANON);
  assert.match(out, /^Summarize\./);
  assert.match(out, /Video: My Video/);
  assert.ok(out.includes(CANON));
});

test('buildPrompt falls back to default when instructions empty', () => {
  const out = buildPrompt('', 'My Video', CANON);
  assert.ok(out.startsWith(DEFAULT_PROMPT.trim()));
});

test('buildPrompt without a title still includes the url', () => {
  const out = buildPrompt('Summarize.', '', CANON);
  assert.ok(out.includes(CANON));
  assert.ok(!out.includes('Video: '));
});
