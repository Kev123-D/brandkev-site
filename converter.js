/* BrandKev — Color Code Converter (also powers the CMYK guide) */
(function () {
  'use strict';
  var BK = window.BK;
  var input = document.getElementById('cv-input');
  if (!input) return;
  var picker = document.getElementById('cv-picker');
  var preview = document.getElementById('cv-preview');
  var rows = document.getElementById('cv-rows');
  var shades = document.getElementById('cv-shades');
  var harmony = document.getElementById('cv-harmony');
  var nameEl = document.getElementById('cv-name');
  var err = document.getElementById('cv-error');
  var contrastEl = document.getElementById('cv-contrast');

  function f(n, d) { return Number(n.toFixed(d || 0)); }

  function show(hex, fromUser) {
    var rgb = BK.hexToRgb(hex), hsl = BK.rgbToHsl(rgb.r, rgb.g, rgb.b), hsv = BK.rgbToHsv(rgb.r, rgb.g, rgb.b), cmyk = BK.rgbToCmyk(rgb.r, rgb.g, rgb.b);
    var nm = BK.nearestName(hex);
    preview.style.background = hex;
    preview.style.color = BK.textOn(hex);
    preview.querySelector('.pv-hex').textContent = hex;
    picker.value = hex.toLowerCase();
    if (nameEl) nameEl.textContent = (nm.exact ? '' : 'Closest named color: ') + nm.name + (nm.exact ? '' : ' (' + nm.hex + ')');
    var vals = [
      ['HEX', hex],
      ['RGB', 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')'],
      ['HSL', 'hsl(' + f(hsl.h) + ', ' + f(hsl.s) + '%, ' + f(hsl.l) + '%)'],
      ['HSV', 'hsv(' + f(hsv.h) + ', ' + f(hsv.s) + '%, ' + f(hsv.v) + '%)'],
      ['CMYK', 'cmyk(' + f(cmyk.c) + '%, ' + f(cmyk.m) + '%, ' + f(cmyk.y) + '%, ' + f(cmyk.k) + '%)'],
      ['CSS', nm.exact ? nm.key : hex.toLowerCase()]
    ];
    if (rows) rows.innerHTML = vals.map(function (v) {
      return '<div class="code-row"><span class="k">' + v[0] + '</span><span class="v">' + v[1] + '</span><button type="button" class="copy" data-copy="' + v[1] + '" aria-label="Copy ' + v[0] + ' value">Copy</button></div>';
    }).join('');
    // CMYK-only rows for the print guide
    var cm = document.getElementById('cm-values');
    if (cm) {
      cm.innerHTML = [['C', cmyk.c], ['M', cmyk.m], ['Y', cmyk.y], ['K', cmyk.k]].map(function (v) {
        return '<div class="cmyk-cell"><span class="k">' + v[0] + '</span><span class="v">' + f(v[1]) + '%</span></div>';
      }).join('');
      var cmStr = 'C' + f(cmyk.c) + ' M' + f(cmyk.m) + ' Y' + f(cmyk.y) + ' K' + f(cmyk.k);
      var cmCopy = document.getElementById('cm-copy'); if (cmCopy) cmCopy.setAttribute('data-copy', cmStr);
    }
    if (shades) {
      var list = [];
      for (var i = 9; i >= 1; i--) list.push(BK.hslToHex(hsl.h, hsl.s, i * 10));
      shades.innerHTML = list.map(chip).join('');
    }
    if (harmony) {
      var hs = [['Complementary', [180]], ['Analogous', [-30, 30]], ['Triadic', [120, 240]], ['Split complementary', [150, 210]]];
      harmony.innerHTML = hs.map(function (g) {
        return '<div class="harm"><div class="harm-name">' + g[0] + '</div><div class="harm-chips">' + chip(hex) + g[1].map(function (d) { return chip(BK.hslToHex(hsl.h + d, hsl.s, hsl.l)); }).join('') + '</div></div>';
      }).join('');
    }
    if (contrastEl) {
      var w = BK.contrast(hex, '#FFFFFF'), b = BK.contrast(hex, '#000000');
      contrastEl.innerHTML = cbox('White text', '#FFFFFF', hex, w) + cbox('Black text', '#000000', hex, b);
    }
    if (fromUser) {
      try { window.history.replaceState(null, '', '?hex=' + hex.slice(1)); } catch (e) {}
    }
  }
  function chip(h) {
    return '<button type="button" class="chip" style="background:' + h + ';color:' + BK.textOn(h) + '" data-load="' + h + '" aria-label="Use ' + h + '">' + h + '</button>';
  }
  function cbox(label, fg, bg, ratio) {
    var r = ratio.toFixed(2), pass = ratio >= 4.5 ? 'AA pass' : ratio >= 3 ? 'AA large text only' : 'Fails AA';
    return '<div class="cbox" style="background:' + bg + ';color:' + fg + '"><strong>Aa</strong><span>' + label + ' · ' + r + ':1</span><span class="badge">' + pass + '</span></div>';
  }

  function fromInput() {
    var hex = BK.parse(input.value);
    if (!hex) { err.textContent = input.value.trim() ? "That doesn't look like a color. Try #003FFC, rgb(0, 63, 252), hsl(225, 100%, 49%) or a name like coral." : ''; return; }
    err.textContent = ''; show(hex, true);
  }
  input.addEventListener('input', fromInput);
  picker.addEventListener('input', function () { input.value = picker.value.toUpperCase(); err.textContent = ''; show(picker.value.toUpperCase(), true); });
  document.addEventListener('click', function (e) {
    var c = e.target.closest('[data-load]'); if (!c) return;
    var h = c.getAttribute('data-load'); input.value = h; err.textContent = ''; show(h, true);
    BK.copy(h);
  });

  var q = new URLSearchParams(location.search).get('hex');
  var startHex = (q && BK.parse('#' + q)) || BK.parse(input.value) || '#003FFC';
  input.value = startHex; show(startHex, false);
})();
