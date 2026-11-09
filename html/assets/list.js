(function () {
  'use strict';
  var data = window.AC8_LIST || [];
  var ROLES = [
    { key: 'fighter',    label: '戦闘機' },
    { key: 'multirole',  label: '多用途機' },
    { key: 'attacker',   label: '攻撃機' },
    { key: 'electronic', label: '電子戦機' }
  ];
  var label = {}; ROLES.forEach(function (r) { label[r.key] = r.label; });
  var active = {};   // key -> true (空なら全表示)

  var legend = document.getElementById('legend');
  var body = document.getElementById('lbody');

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function buildLegend() {
    var all = el('button', 'rolebtn all', 'すべて (' + data.length + ')');
    all.type = 'button';
    all.addEventListener('click', function () { active = {}; refresh(); });
    legend.appendChild(all);
    ROLES.forEach(function (r) {
      var n = data.filter(function (d) { return d.role === r.key; }).length;
      var b = el('button', 'rolebtn role-' + r.key, r.label + ' (' + n + ')');
      b.type = 'button';
      b.dataset.key = r.key;
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () {
        active[r.key] = !active[r.key];
        refresh();
      });
      legend.appendChild(b);
    });
  }

  function anyActive() { return ROLES.some(function (r) { return active[r.key]; }); }

  function render() {
    body.textContent = '';
    var filt = anyActive();
    data.forEach(function (d) {
      if (filt && !active[d.role]) return;
      var tr = el('tr', 'role-' + d.role);
      var nm = el('td', 'nm l');
      nm.appendChild(el('span', 'dot'));
      nm.appendChild(document.createTextNode(d.name));
      nm.appendChild(el('small', null, '(' + d.jp + ')'));
      tr.appendChild(nm);
      tr.appendChild(el('td', 'rl', label[d.role]));
      tr.appendChild(el('td', 'num', String(d.cost)));
      d.w.forEach(function (w) { tr.appendChild(el('td', 'wp', w)); });
      tr.appendChild(el('td', 'num', String(d.f0)));
      tr.appendChild(el('td', 'num', d.fLv || '—'));
      tr.appendChild(el('td', 'num', d.fAb ? '有り' : '—'));
      tr.appendChild(el('td', 'num', String(d.f20)));
      tr.appendChild(el('td', 'l note', d.note || ''));
      body.appendChild(tr);
    });
  }

  function refresh() {
    Array.prototype.forEach.call(legend.querySelectorAll('[data-key]'), function (b) {
      b.setAttribute('aria-pressed', active[b.dataset.key] ? 'true' : 'false');
    });
    legend.querySelector('.all').setAttribute('aria-pressed', anyActive() ? 'false' : 'true');
    render();
  }

  buildLegend();
  refresh();
})();
