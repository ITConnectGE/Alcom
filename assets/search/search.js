/* Client-side search for the static ALCOM site.
   Configured by an inline ALCOM_SEARCH object on the search page:
     index   - path to the language's index JSON, relative to the page
     base    - path from the page back to the site root, prefixed to result URLs
     strings - UI copy for this language                                        */
(function () {
  'use strict';

  var cfg = window.ALCOM_SEARCH;
  if (!cfg) return;

  var S = cfg.strings;
  var input = document.getElementById('alcom-q');
  var status = document.getElementById('alcom-status');
  var list = document.getElementById('alcom-results');
  var entries = null;
  var pending = null;
  var timer = null;

  var SNIPPET = 170;      // characters of context shown around the first hit
  var MAX_HITS = 60;

  function norm(s) {
    return s.toLowerCase().replace(/\s+/g, ' ');
  }

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function terms(q) {
    var out = [], seen = {}, parts = norm(q).trim().split(' ');
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (p.length >= 2 && !seen[p]) { seen[p] = 1; out.push(p); }
    }
    return out;
  }

  function countOf(hay, needle) {
    var n = 0, i = hay.indexOf(needle);
    while (i !== -1 && n < 20) { n++; i = hay.indexOf(needle, i + needle.length); }
    return n;
  }

  function score(entry, ts, phrase) {
    var title = norm(entry.t), text = norm(entry.x), total = 0;
    for (var i = 0; i < ts.length; i++) {
      var t = ts[i];
      var inTitle = title.indexOf(t) !== -1;
      var hits = countOf(text, t);
      if (!inTitle && !hits) return 0;          // every term has to appear somewhere
      total += (inTitle ? 12 : 0) + Math.min(hits, 6);
    }
    if (title.indexOf(phrase) !== -1) total += 20;
    else if (text.indexOf(phrase) !== -1) total += 8;
    return total;
  }

  /* Window of body text around the first hit, with every term marked. */
  function snippet(text, ts) {
    var low = norm(text), at = -1;
    for (var i = 0; i < ts.length; i++) {
      var p = low.indexOf(ts[i]);
      if (p !== -1 && (at === -1 || p < at)) at = p;
    }
    if (at === -1) at = 0;
    var from = Math.max(0, at - Math.round(SNIPPET / 3));
    var cut = text.slice(from, from + SNIPPET);
    var html = esc(cut);
    var lowCut = norm(cut);
    // collect match ranges first so overlapping terms cannot corrupt the markup
    var marks = [];
    for (var j = 0; j < ts.length; j++) {
      var t = ts[j], k = lowCut.indexOf(t);
      while (k !== -1) { marks.push([k, k + t.length]); k = lowCut.indexOf(t, k + t.length); }
    }
    marks.sort(function (a, b) { return a[0] - b[0]; });
    var merged = [];
    for (var m = 0; m < marks.length; m++) {
      var last = merged[merged.length - 1];
      if (last && marks[m][0] <= last[1]) last[1] = Math.max(last[1], marks[m][1]);
      else merged.push([marks[m][0], marks[m][1]]);
    }
    var out = '', pos = 0;
    for (var n = 0; n < merged.length; n++) {
      out += esc(cut.slice(pos, merged[n][0])) + '<mark>' + esc(cut.slice(merged[n][0], merged[n][1])) + '</mark>';
      pos = merged[n][1];
    }
    out += esc(cut.slice(pos));
    return (from > 0 ? '… ' : '') + out + (from + SNIPPET < text.length ? ' …' : '');
  }

  function render(q) {
    var ts = terms(q);
    list.innerHTML = '';
    if (!ts.length) {
      status.textContent = q.trim() ? S.tooShort : '';
      return;
    }
    var phrase = norm(q).trim();
    var hits = [];
    for (var i = 0; i < entries.length; i++) {
      var s = score(entries[i], ts, phrase);
      if (s > 0) hits.push([s, entries[i]]);
    }
    hits.sort(function (a, b) { return b[0] - a[0]; });
    if (!hits.length) {
      status.textContent = S.none.replace('%s', q.trim());
      return;
    }
    status.textContent = S.found.replace('%d', hits.length).replace('%s', q.trim());
    var frag = document.createDocumentFragment();
    for (var h = 0; h < hits.length && h < MAX_HITS; h++) {
      var e = hits[h][1];
      var li = document.createElement('li');
      li.className = 'alcom-hit';
      li.innerHTML = '<a class="alcom-hit-title" href="' + esc(cfg.base + e.u) + '">' + esc(e.t) + '</a>' +
                     '<div class="alcom-hit-text">' + snippet(e.x, ts) + '</div>' +
                     '<div class="alcom-hit-url">/' + esc(e.u) + '</div>';
      frag.appendChild(li);
    }
    list.appendChild(frag);
  }

  function run(q, push) {
    if (push) {
      var url = q ? '?q=' + encodeURIComponent(q) : location.pathname;
      if (window.history && history.replaceState) history.replaceState(null, '', url);
    }
    if (entries) { render(q); return; }
    pending = q;
    status.textContent = S.loading;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', cfg.index, true);
    xhr.onload = function () {
      if (xhr.status < 200 || xhr.status >= 300) { status.textContent = S.error; return; }
      try { entries = JSON.parse(xhr.responseText); }
      catch (err) { status.textContent = S.error; return; }
      render(pending);
    };
    xhr.onerror = function () { status.textContent = S.error; };
    xhr.send();
  }

  function queryFromUrl() {
    var m = /[?&]q=([^&]*)/.exec(location.search);
    if (!m) return '';
    try { return decodeURIComponent(m[1].replace(/\+/g, ' ')); } catch (e) { return ''; }
  }

  var q0 = queryFromUrl();
  input.value = q0;
  input.focus();
  if (q0) run(q0, false);

  input.addEventListener('input', function () {
    clearTimeout(timer);
    var v = input.value;
    timer = setTimeout(function () { run(v, true); }, 180);
  });

  document.getElementById('alcom-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    clearTimeout(timer);
    run(input.value, true);
  });
})();
