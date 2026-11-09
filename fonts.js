/* BrandKev — Font Pairing tool */
(function () {
  'use strict';
  var BK = window.BK;
  var list = document.getElementById('pairs');
  if (!list) return;
  var cards = Array.prototype.slice.call(list.querySelectorAll('.pair'));
  var loaded = {};

  function loadFamily(name, spec) {
    if (loaded[name]) return;
    loaded[name] = true;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + name.replace(/ /g, '+') + (spec ? ':' + spec : '') + '&display=swap';
    document.head.appendChild(l);
  }
  function apply(card) {
    if (card._done) return; card._done = true;
    var h = card.dataset.h, b = card.dataset.b;
    loadFamily(h, card.dataset.hs); loadFamily(b, card.dataset.bs);
    card.querySelectorAll('.p-head').forEach(function (el) { el.style.fontFamily = "'" + h + "', " + card.dataset.hf; el.style.fontWeight = card.dataset.hw; });
    card.querySelectorAll('.p-body').forEach(function (el) { el.style.fontFamily = "'" + b + "', " + card.dataset.bf; });
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { apply(en.target); io.unobserve(en.target); } });
    }, { rootMargin: '400px 0px' });
    cards.forEach(function (c) { io.observe(c); });
  } else { cards.forEach(apply); }

  // Live preview text
  var headIn = document.getElementById('fp-head'), bodyIn = document.getElementById('fp-body');
  function syncText() {
    var ht = headIn.value.trim(), bt = bodyIn.value.trim();
    cards.forEach(function (c) {
      if (c.dataset.rtl === '1') return; // Arabic pairs keep their own sample
      var hEl = c.querySelector('.p-head'), bEl = c.querySelector('.p-body.sample');
      if (hEl) hEl.textContent = ht || hEl.dataset.default;
      if (bEl) bEl.textContent = bt || bEl.dataset.default;
    });
  }
  headIn.addEventListener('input', syncText);
  bodyIn.addEventListener('input', syncText);

  // Filters
  var filterBtns = document.querySelectorAll('[data-filter]');
  var countEl = document.getElementById('fp-count');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.dataset.filter, n = 0;
      filterBtns.forEach(function (x) { x.setAttribute('aria-pressed', x === btn ? 'true' : 'false'); });
      cards.forEach(function (c) {
        var show = f === 'all' || (' ' + c.dataset.tags + ' ').indexOf(' ' + f + ' ') > -1;
        c.hidden = !show; if (show) n++;
      });
      if (countEl) countEl.textContent = n + (n === 1 ? ' pairing' : ' pairings');
    });
  });

  // Copy CSS / embed
  list.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-get]'); if (!btn) return;
    var c = btn.closest('.pair'), h = c.dataset.h, b = c.dataset.b;
    var url = 'https://fonts.googleapis.com/css2?family=' + h.replace(/ /g, '+') + (c.dataset.hs ? ':' + c.dataset.hs : '') +
      '&family=' + b.replace(/ /g, '+') + (c.dataset.bs ? ':' + c.dataset.bs : '') + '&display=swap';
    if (btn.dataset.get === 'html') {
      BK.copy('<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="' + url + '" rel="stylesheet">', 'Embed code');
    } else {
      BK.copy("h1, h2, h3 {\n  font-family: '" + h + "', " + c.dataset.hf + ";\n  font-weight: " + c.dataset.hw + ";\n}\nbody {\n  font-family: '" + b + "', " + c.dataset.bf + ";\n}", 'CSS');
    }
  });
})();
