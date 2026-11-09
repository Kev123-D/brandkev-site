/* BrandKev — shared helpers: menu, copy, toast, colour maths */
(function () {
  'use strict';

  // Mobile menu
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // WhatsApp links: number assembled at load so it isn't written out in the page
  var wa = ['971', '528', '652', '872'].join('');
  document.querySelectorAll('.js-whatsapp').forEach(function (a) {
    a.href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent("Hi BrandKev, I'd like to know more about your services.");
  });

  // Toast
  var toastEl;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove('show'); }, 1600);
  }

  function copy(text, label) {
    var done = function () { toast((label || text) + ' copied'); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else { fallback(); }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('Press Ctrl+C to copy'); }
      document.body.removeChild(ta);
    }
  }

  // Any element with data-copy copies its value
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-copy]');
    if (el) { e.preventDefault(); copy(el.getAttribute('data-copy'), el.getAttribute('data-copy-label')); }
  });

  // ---------- colour maths ----------
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function hexToRgb(hex) {
    hex = String(hex).trim().replace(/^#/, '');
    if (hex.length === 3 || hex.length === 4) hex = hex.slice(0, 3).split('').map(function (c) { return c + c; }).join('');
    if (hex.length === 8) hex = hex.slice(0, 6);
    if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
    return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function (v) { return clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0'); }).join('').toUpperCase();
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h: h, s: s * 100, l: l * 100 };
  }
  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360; s = clamp(s, 0, 100) / 100; l = clamp(l, 0, 100) / 100;
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
    return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
  }
  function hslToHex(h, s, l) { var c = hslToRgb(h, s, l); return rgbToHex(c.r, c.g, c.b); }
  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    var h = rgbToHsl(r * 255, g * 255, b * 255).h;
    return { h: h, s: max === 0 ? 0 : d / max * 100, v: max * 100 };
  }
  function rgbToCmyk(r, g, b) {
    var rr = r / 255, gg = g / 255, bb = b / 255, k = 1 - Math.max(rr, gg, bb);
    if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 };
    return { c: (1 - rr - k) / (1 - k) * 100, m: (1 - gg - k) / (1 - k) * 100, y: (1 - bb - k) / (1 - k) * 100, k: k * 100 };
  }
  function cmykToRgb(c, m, y, k) {
    c /= 100; m /= 100; y /= 100; k /= 100;
    return { r: 255 * (1 - c) * (1 - k), g: 255 * (1 - m) * (1 - k), b: 255 * (1 - y) * (1 - k) };
  }
  function luminance(r, g, b) {
    var a = [r, g, b].map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }
  function contrast(hexA, hexB) {
    var a = hexToRgb(hexA), b = hexToRgb(hexB);
    var la = luminance(a.r, a.g, a.b), lb = luminance(b.r, b.g, b.b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  function textOn(hex) { return contrast(hex, '#FFFFFF') >= contrast(hex, '#07090F') ? '#FFFFFF' : '#07090F'; }

  // Parse almost any colour string: #hex, rgb(), hsl(), cmyk(), bare "255,0,0", CSS names
  function parse(input) {
    if (!input) return null;
    var s = String(input).trim().toLowerCase();
    var n = s.match(/-?\d*\.?\d+/g);
    if (/^#?[0-9a-f]{3,8}$/.test(s)) { var rgb = hexToRgb(s); return rgb ? rgbToHex(rgb.r, rgb.g, rgb.b) : null; }
    if (s.indexOf('hsl') === 0 && n && n.length >= 3) return hslToHex(+n[0], +n[1], +n[2]);
    if (s.indexOf('cmyk') === 0 && n && n.length >= 4) { var c = cmykToRgb(+n[0], +n[1], +n[2], +n[3]); return rgbToHex(c.r, c.g, c.b); }
    if ((s.indexOf('rgb') === 0 || /^\d{1,3}\s*[, ]\s*\d{1,3}\s*[, ]\s*\d{1,3}$/.test(s)) && n && n.length >= 3) {
      if (n.slice(0, 3).some(function (v) { return +v > 255 || +v < 0; })) return null;
      return rgbToHex(+n[0], +n[1], +n[2]);
    }
    var key = s.replace(/[\s-]/g, '');
    if (NAMES[key]) return NAMES[key];
    return null;
  }

  // CSS named colours (CSS Color Module Level 4)
  var NAMES = {"aliceblue":"#F0F8FF","antiquewhite":"#FAEBD7","aqua":"#00FFFF","aquamarine":"#7FFFD4","azure":"#F0FFFF","beige":"#F5F5DC","bisque":"#FFE4C4","black":"#000000","blanchedalmond":"#FFEBCD","blue":"#0000FF","blueviolet":"#8A2BE2","brown":"#A52A2A","burlywood":"#DEB887","cadetblue":"#5F9EA0","chartreuse":"#7FFF00","chocolate":"#D2691E","coral":"#FF7F50","cornflowerblue":"#6495ED","cornsilk":"#FFF8DC","crimson":"#DC143C","cyan":"#00FFFF","darkblue":"#00008B","darkcyan":"#008B8B","darkgoldenrod":"#B8860B","darkgray":"#A9A9A9","darkgreen":"#006400","darkkhaki":"#BDB76B","darkmagenta":"#8B008B","darkolivegreen":"#556B2F","darkorange":"#FF8C00","darkorchid":"#9932CC","darkred":"#8B0000","darksalmon":"#E9967A","darkseagreen":"#8FBC8F","darkslateblue":"#483D8B","darkslategray":"#2F4F4F","darkturquoise":"#00CED1","darkviolet":"#9400D3","deeppink":"#FF1493","deepskyblue":"#00BFFF","dimgray":"#696969","dodgerblue":"#1E90FF","firebrick":"#B22222","floralwhite":"#FFFAF0","forestgreen":"#228B22","fuchsia":"#FF00FF","gainsboro":"#DCDCDC","ghostwhite":"#F8F8FF","gold":"#FFD700","goldenrod":"#DAA520","gray":"#808080","green":"#008000","greenyellow":"#ADFF2F","honeydew":"#F0FFF0","hotpink":"#FF69B4","indianred":"#CD5C5C","indigo":"#4B0082","ivory":"#FFFFF0","khaki":"#F0E68C","lavender":"#E6E6FA","lavenderblush":"#FFF0F5","lawngreen":"#7CFC00","lemonchiffon":"#FFFACD","lightblue":"#ADD8E6","lightcoral":"#F08080","lightcyan":"#E0FFFF","lightgoldenrodyellow":"#FAFAD2","lightgray":"#D3D3D3","lightgreen":"#90EE90","lightpink":"#FFB6C1","lightsalmon":"#FFA07A","lightseagreen":"#20B2AA","lightskyblue":"#87CEFA","lightslategray":"#778899","lightsteelblue":"#B0C4DE","lightyellow":"#FFFFE0","lime":"#00FF00","limegreen":"#32CD32","linen":"#FAF0E6","magenta":"#FF00FF","maroon":"#800000","mediumaquamarine":"#66CDAA","mediumblue":"#0000CD","mediumorchid":"#BA55D3","mediumpurple":"#9370DB","mediumseagreen":"#3CB371","mediumslateblue":"#7B68EE","mediumspringgreen":"#00FA9A","mediumturquoise":"#48D1CC","mediumvioletred":"#C71585","midnightblue":"#191970","mintcream":"#F5FFFA","mistyrose":"#FFE4E1","moccasin":"#FFE4B5","navajowhite":"#FFDEAD","navy":"#000080","oldlace":"#FDF5E6","olive":"#808000","olivedrab":"#6B8E23","orange":"#FFA500","orangered":"#FF4500","orchid":"#DA70D6","palegoldenrod":"#EEE8AA","palegreen":"#98FB98","paleturquoise":"#AFEEEE","palevioletred":"#DB7093","papayawhip":"#FFEFD5","peachpuff":"#FFDAB9","peru":"#CD853F","pink":"#FFC0CB","plum":"#DDA0DD","powderblue":"#B0E0E6","purple":"#800080","rebeccapurple":"#663399","red":"#FF0000","rosybrown":"#BC8F8F","royalblue":"#4169E1","saddlebrown":"#8B4513","salmon":"#FA8072","sandybrown":"#F4A460","seagreen":"#2E8B57","seashell":"#FFF5EE","sienna":"#A0522D","silver":"#C0C0C0","skyblue":"#87CEEB","slateblue":"#6A5ACD","slategray":"#708090","snow":"#FFFAFA","springgreen":"#00FF7F","steelblue":"#4682B4","tan":"#D2B48C","teal":"#008080","thistle":"#D8BFD8","tomato":"#FF6347","turquoise":"#40E0D0","violet":"#EE82EE","wheat":"#F5DEB3","white":"#FFFFFF","whitesmoke":"#F5F5F5","yellow":"#FFFF00","yellowgreen":"#9ACD32"};

  var PRETTY = {};
  Object.keys(NAMES).forEach(function (k) {
    PRETTY[k] = k.replace(/(light|dark|medium|pale|deep|hot|dodger|cornflower|cadet|midnight|navajo|papaya|lemon|blanched|antique|alice|ghost|floral|old|mint|misty|lavender|lawn|spring|sea|sky|steel|slate|royal|saddle|sandy|rosy|indian|forest|olive|lime|yellow|green|blue|white|violet|red|gray|pink|orchid|purple|goldenrod|turquoise|aquamarine|cyan|salmon|khaki|magenta|orange|smoke|brown|chiffon|cream|whip|puff|blush|lace|wood|drab|almond|silk|rose)/g, ' $1').replace(/\s+/g, ' ').trim().replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  });

  function nearestName(hex) {
    var a = hexToRgb(hex), best = null, bd = Infinity;
    Object.keys(NAMES).forEach(function (k) {
      var b = hexToRgb(NAMES[k]);
      // weighted RGB distance (approximates perceived difference)
      var rm = (a.r + b.r) / 2, dr = a.r - b.r, dg = a.g - b.g, db = a.b - b.b;
      var d = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
      if (d < bd) { bd = d; best = k; }
    });
    return { key: best, name: PRETTY[best], hex: NAMES[best], exact: bd === 0 };
  }

  function fmt(n) { return Math.round(n); }

  window.BK = {
    toast: toast, copy: copy, clamp: clamp,
    hexToRgb: hexToRgb, rgbToHex: rgbToHex, rgbToHsl: rgbToHsl, hslToRgb: hslToRgb, hslToHex: hslToHex,
    rgbToHsv: rgbToHsv, rgbToCmyk: rgbToCmyk, cmykToRgb: cmykToRgb,
    contrast: contrast, textOn: textOn, parse: parse, nearestName: nearestName, NAMES: NAMES, fmt: fmt
  };
})();
