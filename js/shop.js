/* ==========================================================
   WIS-H – webshop: productpagina en winkelmandje
   Het mandje wordt in de browser van de bezoeker bewaard
   (localStorage). Er is nog geen echte betaling gekoppeld.
   ========================================================== */

(function () {
  /* ---------- Producten ----------
     Vul hier de prijs in (bijv. 24.95). Zolang prijs null is,
     toont de site "Prijs volgt" en wordt er geen totaal berekend. */
  var PRODUCTEN = {
    cuphouder: {
      naam: 'Cuphouder',
      prijs: null,
      foto: 'assets/img/product/cuphouder-vooraanzicht.jpg',
      url: 'product.html'
    }
  };

  var KEY = 'wish-mandje';
  var geheugen = {}; /* reserve als de browser niets mag opslaan */

  function lees() {
    try {
      var data = JSON.parse(localStorage.getItem(KEY));
      return data && typeof data === 'object' ? data : {};
    } catch (e) { return geheugen; }
  }
  function bewaar(mandje) {
    geheugen = mandje;
    try { localStorage.setItem(KEY, JSON.stringify(mandje)); } catch (e) {}
  }
  function totaalAantal(mandje) {
    var n = 0;
    for (var id in mandje) { if (PRODUCTEN[id]) n += mandje[id]; }
    return n;
  }
  function euro(bedrag) {
    return bedrag.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' });
  }
  function prijsTekst(product) {
    return product.prijs == null ? 'Prijs volgt' : euro(product.prijs);
  }

  /* ---------- Teller op het mandje in de header ---------- */
  function updateTeller(pop) {
    var n = totaalAantal(lees());
    document.querySelectorAll('.cart-link').forEach(function (link) {
      var badge = link.querySelector('.cart-count');
      badge.textContent = n;
      badge.hidden = n === 0;
      link.setAttribute('aria-label', 'Winkelmandje, ' + n + (n === 1 ? ' product' : ' producten'));
      if (pop) { link.classList.remove('pop'); void link.offsetWidth; link.classList.add('pop'); }
    });
  }
  updateTeller(false);
  window.addEventListener('storage', function () { updateTeller(false); renderMandje(); });

  /* Prijzen overal op de site invullen */
  document.querySelectorAll('[data-prijs]').forEach(function (el) {
    var p = PRODUCTEN[el.dataset.prijs];
    if (p) el.textContent = prijsTekst(p);
  });

  /* ---------- Melding onderin beeld ---------- */
  var toastTimer;
  function toast(html) {
    var t = document.querySelector('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      t.setAttribute('role', 'status');
      document.body.appendChild(t);
    }
    t.innerHTML = html;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3500);
  }

  /* ---------- Aantal-kiezer (− 1 +) ---------- */
  function koppelAantal(wrapper, onChange) {
    var input = wrapper.querySelector('input');
    wrapper.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var v = parseInt(input.value, 10) || 1;
        v += btn.dataset.stap === 'plus' ? 1 : -1;
        input.value = Math.max(1, Math.min(99, v));
        if (onChange) onChange(parseInt(input.value, 10));
      });
    });
    input.addEventListener('change', function () {
      var v = parseInt(input.value, 10);
      input.value = isNaN(v) ? 1 : Math.max(1, Math.min(99, v));
      if (onChange) onChange(parseInt(input.value, 10));
    });
  }

  /* ---------- Productpagina: fotogalerij ---------- */
  var hoofdFoto = document.querySelector('.gallery-main img');
  document.querySelectorAll('.thumb').forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      hoofdFoto.src = thumb.dataset.src;
      hoofdFoto.alt = thumb.querySelector('img').alt;
      document.querySelectorAll('.thumb').forEach(function (t) { t.setAttribute('aria-current', 'false'); });
      thumb.setAttribute('aria-current', 'true');
    });
  });

  /* ---------- Productpagina: in winkelmandje ---------- */
  var addForm = document.querySelector('.add-to-cart');
  if (addForm) {
    koppelAantal(addForm.querySelector('.qty'));
    addForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var id = addForm.dataset.product;
      var n = parseInt(addForm.querySelector('.qty input').value, 10) || 1;
      var mandje = lees();
      mandje[id] = Math.min(99, (mandje[id] || 0) + n);
      bewaar(mandje);
      updateTeller(true);
      toast((n === 1 ? '1 Cuphouder' : n + ' Cuphouders') + ' toegevoegd. <a href="winkelmandje.html">Bekijk winkelmandje</a>');
    });
  }

  /* ---------- Winkelmandje-pagina ---------- */
  function renderMandje() {
    var lijst = document.querySelector('.cart-list');
    if (!lijst) return;
    var mandje = lees();
    var leeg = document.querySelector('.cart-empty');
    var vol = document.querySelector('.cart-filled');
    var ids = Object.keys(mandje).filter(function (id) { return PRODUCTEN[id] && mandje[id] > 0; });

    leeg.hidden = ids.length > 0;
    vol.hidden = ids.length === 0;
    lijst.innerHTML = '';

    ids.forEach(function (id) {
      var p = PRODUCTEN[id], n = mandje[id];

      var li = document.createElement('li');
      li.className = 'cart-item';
      li.innerHTML =
        '<a class="cart-thumb" href="' + p.url + '"><img src="' + p.foto + '" alt="" width="80" height="80"></a>' +
        '<div class="cart-info"><a href="' + p.url + '"><h3>' + p.naam + '</h3></a>' +
        '<p>' + prijsTekst(p) + (p.prijs != null ? ' per stuk' : '') + '</p></div>' +
        '<div class="qty" role="group" aria-label="Aantal ' + p.naam + '">' +
          '<button type="button" data-stap="min" aria-label="Eén minder">−</button>' +
          '<input type="number" min="1" max="99" value="' + n + '" aria-label="Aantal">' +
          '<button type="button" data-stap="plus" aria-label="Eén meer">+</button></div>' +
        '<button class="cart-remove" type="button" aria-label="' + p.naam + ' verwijderen">Verwijderen</button>';
      lijst.appendChild(li);

      koppelAantal(li.querySelector('.qty'), function (nieuw) {
        var m = lees(); m[id] = nieuw; bewaar(m); updateTeller(false); renderTotaal();
      });
      li.querySelector('.cart-remove').addEventListener('click', function () {
        var m = lees(); delete m[id]; bewaar(m); updateTeller(false); renderMandje();
      });
    });
    renderTotaal();
  }

  function renderTotaal() {
    var el = document.querySelector('.cart-total');
    if (!el) return;
    var mandje = lees(), totaal = 0, bekend = true, n = totaalAantal(mandje);
    for (var id in mandje) {
      var p = PRODUCTEN[id];
      if (!p) continue;
      if (p.prijs == null) bekend = false; else totaal += p.prijs * mandje[id];
    }
    document.querySelector('.cart-items-count').textContent = n + (n === 1 ? ' product' : ' producten');
    el.textContent = bekend ? euro(totaal) : 'Volgt zodra de prijs bekend is';
  }
  renderMandje();

  var afrekenen = document.querySelector('.checkout');
  if (afrekenen) {
    afrekenen.addEventListener('click', function () {
      document.querySelector('.checkout-note').hidden = false;
    });
  }
})();