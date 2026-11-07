(function () {
  'use strict';
  var data = window.AC8_DATA || [];
  var sel = document.getElementById('sel');
  var chips = document.getElementById('chips');
  var summary = document.getElementById('summary');
  var thead = document.getElementById('thead');
  var tbody = document.getElementById('tbody');
  var onlySpecial = document.getElementById('onlySpecial');
  var onlyChange = document.getElementById('onlyChange');
  var current = null;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // 特殊な強化項目(弾数増加などの通常項目以外)
  function isSpecial(t) {
    return /【|Lv\.\s*\d|アビリティ|強化|補正|軽減|短縮/.test(t) && !/^AIRCRAFT SPEC/.test(t);
  }

  function find(id) {
    for (var i = 0; i < data.length; i++) if (data[i].id === id) return data[i];
    return data[0];
  }

  function buildPicker() {
    data.forEach(function (a) {
      var o = el('option', null, a.name);
      o.value = a.id;
      sel.appendChild(o);
      var c = el('button', 'chip', a.name);
      c.type = 'button';
      c.setAttribute('role', 'tab');
      c.dataset.id = a.id;
      c.addEventListener('click', function () { show(a.id, true); });
      chips.appendChild(c);
    });
    sel.addEventListener('change', function () { show(sel.value, true); });
  }

  function card(k, v, small) {
    var c = el('div', 'card');
    c.appendChild(el('div', 'k', k));
    var vv = el('div', 'v', v);
    if (small) { vv.appendChild(document.createTextNode(' ')); vv.appendChild(el('small', null, small)); }
    c.appendChild(vv);
    return c;
  }

  function renderSummary(a) {
    summary.textContent = '';
    if (a.cost != null) summary.appendChild(card('COST', String(a.cost)));
    var first = a.levels[0], last = a.levels[a.levels.length - 1];
    summary.appendChild(card('最大レベル', 'Lv.' + last.cap));
    a.cols.forEach(function (c) {
      var f = null, l = null;
      a.levels.forEach(function (r) {
        var v = r.ammo[c];
        if (v == null) return;
        if (f == null) f = v;
        l = v;
      });
      if (f == null) return;
      summary.appendChild(card(c, String(l), f === l ? '' : '(' + f + ' → ' + l + ')'));
    });
  }

  function render(a) {
    // ヘッダ
    thead.textContent = '';
    var tr = el('tr');
    ['Lv'].concat(a.cols).concat(['NEW UPGRADES']).forEach(function (h) { tr.appendChild(el('th', null, h)); });
    thead.appendChild(tr);

    tbody.textContent = '';
    var prev = null;
    a.levels.forEach(function (r) {
      var row = el('tr');
      if (prev && r.cap !== prev.cap) row.className = 'capup';
      var lv = el('td', 'lv', 'Lv.' + r.lv);
      lv.appendChild(el('small', null, '上限 ' + r.cap));
      row.appendChild(lv);

      a.cols.forEach(function (c) {
        var v = r.ammo[c];
        var td = el('td', 'num');
        if (v == null) { td.textContent = '—'; td.classList.add('none'); }
        else {
          td.textContent = String(v);
          if (onlyChange.checked && prev && prev.ammo[c] != null && prev.ammo[c] !== v) td.classList.add('chg');
          if (onlyChange.checked && prev && prev.ammo[c] == null) td.classList.add('chg');
        }
        row.appendChild(td);
      });

      var up = el('td', 'up');
      var items = r.up.filter(function (t) { return t !== 'なし'; });
      if (onlySpecial.checked) items = items.filter(isSpecial);
      if (!items.length) {
        up.appendChild(el('span', 'none', onlySpecial.checked ? '—' : 'なし'));
      } else {
        items.forEach(function (t) {
          var cls = 'tag' + (isSpecial(t) ? ' sp' : '');
          up.appendChild(el('span', cls, t));
        });
      }
      row.appendChild(up);
      tbody.appendChild(row);
      prev = r;
    });
  }

  function show(id, pushHash) {
    var a = find(id);
    current = a;
    sel.value = a.id;
    Array.prototype.forEach.call(chips.children, function (c) {
      c.setAttribute('aria-selected', c.dataset.id === a.id ? 'true' : 'false');
    });
    document.title = a.name + ' | AC8 機体レベルアップ一覧';
    renderSummary(a);
    render(a);
    if (pushHash) {
      try { history.replaceState(null, '', '#' + encodeURIComponent(a.id)); } catch (e) { location.hash = a.id; }
    }
  }

  buildPicker();
  onlySpecial.addEventListener('change', function () { render(current); });
  onlyChange.addEventListener('change', function () { render(current); });
  window.addEventListener('hashchange', function () {
    var h = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (h) show(h, false);
  });

  var start = decodeURIComponent(location.hash.replace(/^#/, ''));
  show(start || (data[0] && data[0].id), false);
})();
