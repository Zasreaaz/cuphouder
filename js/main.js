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

/* ==========================================================
   Vallende blaadjes en inschuif-animatie
   ========================================================== */
(function () {
  var LEAF = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path fill="currentColor" d="M20 3C11 3 4 8 4 16c0 1.5.3 3 .8 4.2C6 15 9.5 11 15 8.5 10.5 12 7.6 16 6.4 21 7.6 21.6 9 22 10.5 22 17 22 21 15 20 3z"/>' +
    '</svg>';
  var COLORS = ['#4B904F', '#7DB85F', '#9FCBAA', '#2E6B3F'];

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function addLeaves(container, count) {
    var layer = document.createElement('div');
    layer.className = 'leaves';
    layer.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < count; i++) {
      var leaf = document.createElement('span');
      leaf.className = 'leaf';
      leaf.innerHTML = LEAF;
      leaf.style.setProperty('--x', rand(2, 96) + '%');
      leaf.style.setProperty('--s', rand(14, 26) + 'px');
      leaf.style.setProperty('--d', rand(9, 16) + 's');
      leaf.style.setProperty('--delay', -rand(0, 16) + 's');
      leaf.style.setProperty('--r', rand(0, 360) + 'deg');
      leaf.style.setProperty('--drift', rand(-80, 80) + 'px');
      leaf.style.setProperty('--c', COLORS[i % COLORS.length]);
      layer.appendChild(leaf);
    }
    container.prepend(layer);

    function setHeight() { layer.style.setProperty('--h', container.offsetHeight + 'px'); }
    setHeight();
    window.addEventListener('resize', setHeight);
  }

  var small = window.matchMedia('(max-width: 600px)').matches;
  document.querySelectorAll('.hero').forEach(function (el) { addLeaves(el, small ? 6 : 12); });
  document.querySelectorAll('.cta-box').forEach(function (el) { addLeaves(el, small ? 4 : 7); });
  document.querySelectorAll('.orbit-section').forEach(function (el) { addLeaves(el, small ? 5 : 9); });
  document.querySelectorAll('footer').forEach(function (el) { addLeaves(el, small ? 3 : 6); });

  /* Kaarten licht laten optillen bij hover */
  document.querySelectorAll('.member, .stat, .bin').forEach(function (el) {
    el.classList.add('card-hover');
  });

  /* Inhoud zacht laten inschuiven tijdens het scrollen */
  if (!('IntersectionObserver' in window)) return;
  var items = document.querySelectorAll('main section h2, main section .lead, .benefits > div, .member, .stat, .bin, .cta-box, .photo');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  items.forEach(function (el, i) {
    el.classList.add('reveal');
    el.style.transitionDelay = (i % 4) * 80 + 'ms';
    io.observe(el);
  });
})();

/* ==========================================================
   Impact: klik op een cupje, hij vliegt in de houder
   en de bijbehorende tekst verschijnt
   ========================================================== */
(function () {
  var orbit = document.querySelector('.orbit');
  if (!orbit) return;

  var product = orbit.querySelector('.orbit-product');
  var stack = orbit.querySelector('.hp-stack');
  var buttons = orbit.querySelectorAll('.orbit-cup');
  var panels = document.querySelectorAll('.orbit-panel .panel');
  var countEl = document.getElementById('cup-count');
  var resetBtn = document.querySelector('.orbit-reset');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var inHolder = 0;
  var busy = false;

  function showPanel(name) {
    panels.forEach(function (p) {
      var match = p.dataset.panel === name;
      p.hidden = !match;
      p.classList.remove('show');
      if (match) { void p.offsetWidth; p.classList.add('show'); }
    });
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.panel === name ? 'true' : 'false');
    });
  }

  /* Voegt een cupje toe aan de stapel in de houder */
  function addToStack() {
    var y = 266 - inHolder * 6;  /* onderste cupje hangt met de rand op de nokjes */  /* cupjes schuiven in elkaar, onderaan beginnen */
    var cup = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    cup.setAttribute('d', 'M34 ' + y + 'h52l-7 30h-38z');
    cup.style.setProperty('--from', (14 - y) * (product.offsetHeight / 324) + 'px');
    cup.setAttribute('class', 'hp-cup' + (reduceMotion ? '' : ' drop'));
    stack.appendChild(cup);
    inHolder++;
    countEl.textContent = inHolder;
    resetBtn.hidden = false;
    if (!reduceMotion) {
      product.classList.remove('bump'); void product.offsetWidth; product.classList.add('bump');
    }
  }

  /* Laat een cupje van de knop naar de opening van de houder vliegen */
  function fly(btn, done) {
    var o = orbit.getBoundingClientRect();
    var ball = btn.querySelector('.cup-ball').getBoundingClientRect();
    var holder = product.getBoundingClientRect();

    var start = { x: ball.left + ball.width / 2 - o.left, y: ball.top + ball.height / 2 - o.top };
    var end = { x: holder.left + holder.width * 0.5 - o.left, y: holder.top + holder.height * 0.13 - o.top };
    var peak = { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - o.height * 0.18 };

    var el = document.createElement('div');
    el.className = 'flying-cup';
    el.innerHTML = btn.querySelector('.cup-ball').innerHTML;
    el.style.left = start.x + 'px';
    el.style.top = start.y + 'px';
    orbit.appendChild(el);
    btn.classList.add('flying');

    var anim = el.animate([
      { left: start.x + 'px', top: start.y + 'px', transform: 'scale(1) rotate(0deg)', opacity: 1 },
      { left: peak.x + 'px', top: peak.y + 'px', transform: 'scale(1.1) rotate(-8deg)', opacity: 1, offset: 0.5 },
      { left: end.x + 'px', top: (end.y - 10) + 'px', transform: 'scale(.9) rotate(4deg)', opacity: 1, offset: 0.85 },
      { left: end.x + 'px', top: (end.y + 20) + 'px', transform: 'scale(.6) rotate(0deg)', opacity: 0 }
    ], { duration: 900, easing: 'cubic-bezier(.45,.05,.4,1)' });

    anim.onfinish = function () {
      el.remove();
      btn.classList.remove('flying');
      done();
    };
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (busy) return;
      var name = btn.dataset.panel;

      /* Al in de houder: alleen de tekst tonen */
      if (btn.classList.contains('used')) { showPanel(name); return; }

      btn.classList.add('used');
      if (reduceMotion) { addToStack(); showPanel(name); return; }

      busy = true;
      fly(btn, function () {
        addToStack();
        showPanel(name);
        busy = false;
      });
    });
  });

  var bin = orbit.querySelector('.recycle-bin');
  var CUP_SVG = '<svg viewBox="0 0 44 20" preserveAspectRatio="none"><path d="M1 1h42l-4 18H5z" fill="#FCFCF8" stroke="#AEB9B0" stroke-width="1.6" stroke-linejoin="round"/></svg>';

  function clearHolder() {
    stack.innerHTML = '';
    inHolder = 0;
    countEl.textContent = 0;
    buttons.forEach(function (b) { b.classList.remove('used'); });
    resetBtn.hidden = true;
    showPanel('intro');
  }

  /* Houder legen: de cupjes vallen onderuit de buis in de kartonnen bak */
  resetBtn.addEventListener('click', function () {
    if (busy) return;
    if (reduceMotion || inHolder === 0) { clearHolder(); return; }
    busy = true;
    resetBtn.disabled = true;

    var o = orbit.getBoundingClientRect();
    var cups = Array.prototype.slice.call(stack.querySelectorAll('.hp-cup'));
    bin.classList.add('show');

    setTimeout(function () {
      var b = bin.getBoundingClientRect();
      var target = { x: b.left + b.width / 2 - o.left, y: b.top + b.height * 0.42 - o.top };

      var h = product.getBoundingClientRect();
      var exitY = h.top - o.top + h.height * 0.02;   /* net boven de opening */
      cups.reverse();                                 /* bovenste cupje eerst */

      cups.forEach(function (cup, i) {
        var r = cup.getBoundingClientRect();
        var el = document.createElement('div');
        el.className = 'falling-cup';
        el.innerHTML = CUP_SVG;
        el.style.left = (r.left - o.left) + 'px';
        el.style.top = (r.top - o.top) + 'px';
        el.style.width = r.width + 'px';
        el.style.height = r.height + 'px';
        el.style.zIndex = 1;   /* eerst achter de buis: schuift binnenin omhoog */
        orbit.appendChild(el);
        cup.remove();

        var cx = r.left - o.left + r.width / 2;
        var cy = r.top - o.top + r.height / 2;
        var up = exitY - cy;
        var side = (i % 2 ? 1 : -1) * h.width * 0.9;
        var dx = target.x - cx;
        var dy = target.y - cy;
        var tilt = (i % 2 ? 1 : -1) * 8;   /* cupjes blijven rechtop hangen, alleen licht wiebelen */

        var anim = el.animate([
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: 'translate(0,' + up + 'px) rotate(0deg)', opacity: 1, offset: 0.35 },
          { transform: 'translate(' + side + 'px,' + (up - 20) + 'px) rotate(' + tilt + 'deg)', opacity: 1, offset: 0.55 },
          { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (-tilt) + 'deg) scale(.85)', opacity: 1, offset: 0.92 },
          { transform: 'translate(' + dx + 'px,' + (dy + 12) + 'px) rotate(0deg) scale(.7)', opacity: 0 }
        ], { duration: 1100, delay: i * 180, easing: 'ease-in-out', fill: 'backwards' });
        setTimeout(function () { el.style.zIndex = 5; }, i * 180 + 1100 * 0.35);
        anim.onfinish = function () {
          el.remove();
          bin.classList.remove('shake'); void bin.offsetWidth; bin.classList.add('shake');
        };
      });

      countEl.textContent = 0;
      var total = 1100 + (cups.length - 1) * 180;
      setTimeout(function () {
        bin.classList.remove('show', 'shake');
        clearHolder();
        resetBtn.disabled = false;
        busy = false;
      }, total + 700);
    }, 350);
  });
})();