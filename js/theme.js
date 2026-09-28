/* Zet de opgeslagen licht/donker-keuze direct bij het laden,
   zodat de pagina niet eerst licht flitst. Wordt in de <head> geladen. */
(function () {
  try {
    if (localStorage.getItem('cuphouder-mode') === 'dark') {
      document.documentElement.setAttribute('data-mode', 'dark');
    }
  } catch (e) { /* opslag niet beschikbaar: blijf licht */ }
})();
