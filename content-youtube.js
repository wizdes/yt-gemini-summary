// Tells the service worker the current YouTube URL so it can light up a green
// "ready" badge on the toolbar icon when you're on a video. YouTube is a single
// page app, so we report on first load and on every in-page navigation.
(() => {
  let last = null;

  function report() {
    if (location.href === last) return;
    last = location.href;
    try {
      chrome.runtime.sendMessage({ type: 'YT_URL', url: location.href });
    } catch {
      // service worker asleep or extension reloading — next nav retries.
    }
  }

  report();
  // YouTube fires this when it finishes an in-app navigation.
  window.addEventListener('yt-navigate-finish', report, true);
  window.addEventListener('yt-page-data-updated', report, true);
  // Belt-and-suspenders for history.pushState navigations.
  window.addEventListener('popstate', report);
})();
