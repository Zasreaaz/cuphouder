/* ==========================================================
   Cuphouder – interactie: licht/donker-knop en hamburgermenu
   ========================================================== */

(function () {
  var root = document.documentElement;

  /* ---------- Licht / donker ---------- */
  var modeBtn = document.querySelector('.mode');

  function updateModeLabel() {
    var dark = root.getAttribute('data-mode') === 'dark';
    modeBtn.setAttribute('aria-label', dark ? 'Lichte modus aanzetten' : 'Donkere modus aanzetten');
  }

  modeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-mode') === 'dark' ? 'light' : 'dark';
    if (next === 'dark') root.setAttribute('data-mode', 'dark');
    else root.removeAttribute('data-mode');
    try { localStorage.setItem('cuphouder-mode', next); } catch (e) {}
    updateModeLabel();
  });
  updateModeLabel();

  /* ---------- Hamburgermenu ---------- */
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('hoofdmenu');

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
  }

  burger.addEventListener('click', function () {
    setMenu(!nav.classList.contains('is-open'));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });
})();
