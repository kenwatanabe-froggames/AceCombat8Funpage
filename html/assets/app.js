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
  var abChips = document.getElementById('abChips');
  var abResults = document.getElementById('abResults');
  var abClear = document.getElementById('abClear');
  var selected = {};          // アビリティ名 -> true
  var abMap = {};             // アビリティ名 -> { 機体id: 解放Lv }
  var mode = 'and';

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

  function abName(t) { return t.replace(/\s*Lv\.\d+$/, ''); }
  function isAbility(t) { return isSpecial(t) && t.indexOf('アビリティスロット') < 0; }

  function buildAbMap() {
    data.forEach(function (a) {
      a.levels.forEach(function (r) {
        r.up.forEach(function (t) {
          if (!isAbility(t)) return;
          var n = abName(t);
          if (!abMap[n]) abMap[n] = {};
          if (abMap[n][a.id] == null) abMap[n][a.id] = r.lv;
        });
      });
    });
  }

  function selectedNames() { return Object.keys(selected).filter(function (k) { return selected[k]; }); }

  function matchIds() {
    var names = selectedNames();
    if (!names.length) return null;
    return data.filter(function (a) {
      var has = names.map(function (n) { return abMap[n] && abMap[n][a.id] != null; });
      return mode === 'and' ? has.every(Boolean) : has.some(Boolean);
    }).map(function (a) { return a.id; });
  }

  function buildAbChips() {
    var names = Object.keys(abMap).sort(function (x, y) {
      var d = Object.keys(abMap[y]).length - Object.keys(abMap[x]).length;
      return d || x.localeCompare(y, 'ja');
    });
    names.forEach(function (n) {
      var b = el('button', 'abchip', n);
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.appendChild(el('span', 'n', Object.keys(abMap[n]).length + '機'));
      b.addEventListener('click', function () {
        selected[n] = !selected[n];
        b.setAttribute('aria-pressed', selected[n] ? 'true' : 'false');
        refreshFinder();
      });
      abChips.appendChild(b);
    });
  }

  function refreshFinder() {
    var ids = matchIds();
    var names = selectedNames();
    abResults.textContent = '';
    if (ids) {
      if (!ids.length) abResults.appendChild(el('div', 'empty', '条件に合う機体はありません。'));
      ids.forEach(function (id) {
        var a = find(id);
        var card = el('button', 'rescard');
        card.type = 'button';
        card.appendChild(el('div', 'nm', a.name));
        var ul = el('ul');
        names.forEach(function (n) {
          if (abMap[n] && abMap[n][id] != null) {
            var li = el('li');
            li.appendChild(el('b', null, 'Lv.' + abMap[n][id]));
            li.appendChild(document.createTextNode(n));
            ul.appendChild(li);
          }
        });
        card.appendChild(ul);
        card.addEventListener('click', function () {
          show(id, true);
          document.getElementById('summary').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        abResults.appendChild(card);
      });
    }
    Array.prototype.forEach.call(chips.children, function (c) {
      c.classList.toggle('dim', !!ids && ids.indexOf(c.dataset.id) < 0);
    });
    if (current) render(current);
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
      var c = el('button', 'chip role-' + a.role, a.name);
      c.dataset.role = a.role;
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
    var RL = { fighter: '戦闘機', multirole: '多用途機', attacker: '攻撃機', electronic: '電子戦機' };
    if (a.role) {
      var rc = card('機種', RL[a.role] || a.role);
      rc.className = 'card rolecard role-' + a.role;
      summary.appendChild(rc);
    }
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
          var cls = 'tag' + (isSpecial(t) ? ' sp' : '') + (selected[abName(t)] ? ' hit' : '');
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
  buildAbMap();
  buildAbChips();
  Array.prototype.forEach.call(document.querySelectorAll('input[name="mode"]'), function (r) {
    r.addEventListener('change', function () { mode = r.value; refreshFinder(); });
  });
  abClear.addEventListener('click', function () {
    selected = {};
    Array.prototype.forEach.call(abChips.children, function (b) { b.setAttribute('aria-pressed', 'false'); });
    refreshFinder();
  });
  onlySpecial.addEventListener('change', function () { render(current); });
  onlyChange.addEventListener('change', function () { render(current); });
  window.addEventListener('hashchange', function () {
    var h = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (h) show(h, false);
  });

  var start = decodeURIComponent(location.hash.replace(/^#/, ''));
  show(start || (data[0] && data[0].id), false);
})();
