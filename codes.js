/* BrandKev — Color codes library: search + filter (table is pre-rendered for SEO) */
(function () {
  'use strict';
  var search = document.getElementById('cc-search');
  if (!search) return;
  var items = Array.prototype.slice.call(document.querySelectorAll('.cc-item'));
  var groups = Array.prototype.slice.call(document.querySelectorAll('.cc-group'));
  var countEl = document.getElementById('cc-count');
  var empty = document.getElementById('cc-empty');
  function run() {
    var q = search.value.trim().toLowerCase().replace(/^#/, ''), n = 0;
    items.forEach(function (it) {
      var hit = !q || it.dataset.s.indexOf(q) > -1;
      it.hidden = !hit; if (hit) n++;
    });
    groups.forEach(function (g) { g.hidden = !g.querySelector('.cc-item:not([hidden])'); });
    countEl.textContent = n + ' colors';
    empty.hidden = n !== 0;
  }
  search.addEventListener('input', run);
})();
