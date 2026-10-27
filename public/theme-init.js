// Runs before the app bundle so the correct theme is painted on the very first
// frame (no white flash in dark mode). Mirrors applyTheme() in src/stores/uiStore.ts.
(function () {
  try {
    var pref = 'system';
    var raw = localStorage.getItem('clockwise-ui');
    if (raw) pref = (JSON.parse(raw).state || {}).theme || 'system';
    if (pref !== 'light' && pref !== 'dark') {
      pref = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    var root = document.documentElement;
    root.setAttribute('data-theme', pref);
    root.style.colorScheme = pref;
    var bg = pref === 'dark' ? '#0a0a0a' : '#ffffff';
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      m.setAttribute('content', bg);
    });
  } catch (e) {
    /* storage blocked — default light theme */
  }
})();
