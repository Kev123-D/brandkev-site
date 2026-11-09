/* BrandKev — Color Palette Generator */
(function () {
  'use strict';
  var BK = window.BK;
  var root = document.getElementById('palette');
  if (!root) return;

  var modeBtns = document.querySelectorAll('[data-mode]');
  var countSel = document.getElementById('pal-count');
  var baseInput = document.getElementById('pal-base');
  var basePicker = document.getElementById('pal-base-picker');
  var exportBox = document.getElementById('pal-export');
  var mode = 'auto';
  var colors = [];   // [{hex, locked}]
  var undoStack = [];

  function rand(a, b) { return a + Math.random() * (b - a); }
  function wrap(h) { return ((h % 360) + 360) % 360; }

  // Build a harmonious palette around a base hue using HSL rules
  function generate(n, m, baseHex) {
    var base = baseHex ? BK.rgbToHsl.apply(null, objToArr(BK.hexToRgb(baseHex))) : { h: rand(0, 360), s: rand(45, 85), l: rand(42, 62) };
    var h = base.h, s = base.s, l = base.l, out = [];
    if (m === 'auto') m = ['analogous', 'complementary', 'triadic', 'split', 'monochrome', 'tetradic'][Math.floor(Math.random() * 6)];
    var hues;
    switch (m) {
      case 'analogous': hues = [-40, -20, 0, 20, 40, 60, -60]; break;
      case 'complementary': hues = [0, 0, 180, 180, 0, 180, 0]; break;
      case 'triadic': hues = [0, 120, 240, 0, 120, 240, 0]; break;
      case 'split': hues = [0, 150, 210, 0, 150, 210, 0]; break;
      case 'tetradic': hues = [0, 90, 180, 270, 0, 90, 180]; break;
      default: hues = [0, 0, 0, 0, 0, 0, 0];
    }
    // spread lightness from dark to light so the palette is usable for UI and brand work
    for (var i = 0; i < n; i++) {
      var t = n === 1 ? 0.5 : i / (n - 1);
      var li = m === 'monochrome' ? 18 + t * 70 : BK.clamp(l + (t - 0.5) * 46 + rand(-6, 6), 12, 92);
      var si = m === 'monochrome' ? BK.clamp(s - Math.abs(t - 0.5) * 30, 10, 95) : BK.clamp(s + rand(-18, 12), 18, 95);
      out.push(BK.hslToHex(wrap(h + hues[i % hues.length] + rand(-6, 6)), si, li));
    }
    if (baseHex && n > 0) {
      // keep the exact base colour in the palette
      var mid = Math.floor(n / 2); out[mid] = baseHex.toUpperCase();
    }
    return { hexes: out, mode: m };
  }
  function objToArr(o) { return [o.r, o.g, o.b]; }

  function roll(fromBase) {
    var n = +countSel.value;
    while (colors.length < n) colors.push({ hex: '#000000', locked: false });
    colors.length = n;
    undoStack.push(colors.map(function (c) { return c.hex; }));
    if (undoStack.length > 30) undoStack.shift();
    var lockedBase = fromBase ? BK.parse(baseInput.value) : null;
    var g = generate(n, mode, lockedBase);
    colors.forEach(function (c, i) { if (!c.locked) c.hex = g.hexes[i]; });
    render();
  }

  function render() {
    root.innerHTML = '';
    colors.forEach(function (c, i) {
      var fg = BK.textOn(c.hex), rgb = BK.hexToRgb(c.hex), nm = BK.nearestName(c.hex);
      var sw = document.createElement('div');
      sw.className = 'swatch'; sw.style.background = c.hex; sw.style.color = fg;
      sw.setAttribute('role', 'group'); sw.setAttribute('aria-label', 'Color ' + (i + 1) + ': ' + c.hex);
      sw.innerHTML =
        '<div class="sw-tools">' +
          '<button type="button" class="sw-btn" data-act="lock" aria-pressed="' + c.locked + '" aria-label="' + (c.locked ? 'Unlock' : 'Lock') + ' ' + c.hex + '">' + (c.locked ? lockIcon(true) : lockIcon(false)) + '</button>' +
          '<button type="button" class="sw-btn" data-act="left" aria-label="Move left"' + (i === 0 ? ' disabled' : '') + '>' + arrow('M15 6l-6 6 6 6') + '</button>' +
          '<button type="button" class="sw-btn" data-act="right" aria-label="Move right"' + (i === colors.length - 1 ? ' disabled' : '') + '>' + arrow('M9 6l6 6-6 6') + '</button>' +
        '</div>' +
        '<div class="sw-info">' +
          '<button type="button" class="sw-hex" data-copy="' + c.hex + '" aria-label="Copy ' + c.hex + '">' + c.hex.replace('#', '') + '</button>' +
          '<div class="sw-meta">' + nm.name + '</div>' +
          '<div class="sw-meta mono">RGB ' + rgb.r + ' ' + rgb.g + ' ' + rgb.b + '</div>' +
        '</div>';
      sw.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]'); if (!b) return;
        var act = b.getAttribute('data-act');
        if (act === 'lock') { c.locked = !c.locked; render(); }
        if (act === 'left' && i > 0) { swap(i, i - 1); }
        if (act === 'right' && i < colors.length - 1) { swap(i, i + 1); }
      });
      root.appendChild(sw);
    });
    updateExport();
    try { window.history.replaceState(null, '', '?colors=' + colors.map(function (c) { return c.hex.slice(1); }).join('-')); } catch (e) {}
  }
  function swap(a, b) { var t = colors[a]; colors[a] = colors[b]; colors[b] = t; render(); }
  function arrow(d) { return '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg>'; }
  function lockIcon(on) {
    return '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="' + (on ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 ' + (on ? '8 0v3' : '7.7-1.4') + '" fill="none"/></svg>';
  }

  var fmtSel = document.getElementById('pal-format');
  function updateExport() {
    var hx = colors.map(function (c) { return c.hex; });
    var f = fmtSel ? fmtSel.value : 'css', out = '';
    if (f === 'css') out = ':root {\n' + hx.map(function (h, i) { return '  --color-' + (i + 1) + ': ' + h + ';'; }).join('\n') + '\n}';
    if (f === 'hex') out = hx.join(', ');
    if (f === 'rgb') out = hx.map(function (h) { var c = BK.hexToRgb(h); return 'rgb(' + c.r + ', ' + c.g + ', ' + c.b + ')'; }).join('\n');
    if (f === 'tailwind') out = "colors: {\n  brand: {\n" + hx.map(function (h, i) { return "    " + ((i + 1) * 100) + ": '" + h + "',"; }).join('\n') + "\n  }\n}";
    if (f === 'json') out = JSON.stringify(hx, null, 2);
    exportBox.value = out;
  }
  if (fmtSel) fmtSel.addEventListener('change', updateExport);

  document.getElementById('pal-generate').addEventListener('click', function () { roll(false); });
  document.getElementById('pal-undo').addEventListener('click', function () {
    var prev = undoStack.pop(); if (!prev) { BK.toast('Nothing to undo'); return; }
    colors = prev.map(function (h, i) { return { hex: h, locked: colors[i] ? colors[i].locked : false }; });
    countSel.value = String(colors.length); render();
  });
  document.getElementById('pal-copy-export').addEventListener('click', function () { BK.copy(exportBox.value, 'Palette'); });
  document.getElementById('pal-share').addEventListener('click', function () { BK.copy(location.href, 'Share link'); });
  document.getElementById('pal-png').addEventListener('click', downloadPng);
  countSel.addEventListener('change', function () { roll(false); });
  modeBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      mode = b.getAttribute('data-mode');
      modeBtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      roll(!!BK.parse(baseInput.value));
    });
  });
  function useBase() {
    var hex = BK.parse(baseInput.value);
    if (!hex) { BK.toast('Enter a valid color, e.g. #003FFC'); return; }
    basePicker.value = hex.toLowerCase();
    colors.forEach(function (c) { c.locked = false; });
    roll(true);
  }
  document.getElementById('pal-base-go').addEventListener('click', useBase);
  baseInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); useBase(); } });
  basePicker.addEventListener('input', function () { baseInput.value = basePicker.value.toUpperCase(); });
  basePicker.addEventListener('change', useBase);

  // Spacebar = new palette (unless typing)
  document.addEventListener('keydown', function (e) {
    if (e.code !== 'Space') return;
    var t = e.target.tagName;
    if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || t === 'BUTTON' || e.target.isContentEditable) return;
    e.preventDefault(); roll(false);
  });

  function downloadPng() {
    var w = 1600, h = 900, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var x = cv.getContext('2d'), sw = w / colors.length;
    colors.forEach(function (c, i) {
      x.fillStyle = c.hex; x.fillRect(i * sw, 0, Math.ceil(sw), h);
      x.fillStyle = BK.textOn(c.hex); x.font = '600 40px "JetBrains Mono", monospace';
      x.fillText(c.hex, i * sw + 32, h - 80);
      x.font = '500 22px "Manrope", sans-serif'; x.globalAlpha = 0.8;
      x.fillText(BK.nearestName(c.hex).name, i * sw + 32, h - 44); x.globalAlpha = 1;
    });
    x.fillStyle = BK.textOn(colors[0].hex); x.globalAlpha = 0.7; x.font = '500 20px "JetBrains Mono", monospace';
    x.fillText('brandkev.com', 32, 48); x.globalAlpha = 1;
    var a = document.createElement('a');
    a.download = 'palette-' + colors.map(function (c) { return c.hex.slice(1); }).join('-') + '.png';
    a.href = cv.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove();
    BK.toast('PNG downloaded');
  }

  // Start: from ?colors= link, else a fresh palette
  var q = new URLSearchParams(location.search).get('colors');
  var start = q ? q.split('-').map(function (s) { return BK.parse('#' + s); }).filter(Boolean).slice(0, 10) : [];
  if (start.length >= 2) {
    colors = start.map(function (h) { return { hex: h, locked: false }; });
    countSel.value = String(Math.min(Math.max(start.length, 3), 8));
    if (+countSel.value !== start.length) { var o = document.createElement('option'); o.value = o.textContent = String(start.length); countSel.appendChild(o); countSel.value = String(start.length); }
    render();
  } else { roll(false); }
})();
