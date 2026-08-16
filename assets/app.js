/* ════════════════════════════════════════════════════════════════
   NALVO — shared console runtime
   Chrome injection · panels · filters · charts · toasts
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var PAGE = document.body.dataset.page || '';

  /* ══════════════════ NAV MODEL ══════════════════ */
  var NAV = [
    { label: 'Runtime', items: [
      { id: 'fleet',      href: 'fleet.html',      icon: 'activity', text: 'Live map' },
      { id: 'runs',       href: 'runs.html',       icon: 'route', text: 'Executions', badge: '12' },
      { id: 'approvals',  href: 'approvals.html',  icon: 'circle-check', text: 'Checkpoints', badge: '3' },
      { id: 'agents',     href: 'agents.html',     icon: 'bot', text: 'Workers' }
    ]},
    { label: 'Controls', items: [
      { id: 'tools',        href: 'tools.html',        icon: 'blocks', text: 'Connections' },
      { id: 'schedules',    href: 'schedules.html',    icon: 'clock-3', text: 'Triggers' },
      { id: 'integrations', href: 'integrations.html', icon: 'plug-zap', text: 'Providers' },
      { id: 'logs',         href: 'logs.html',         icon: 'scroll-text', text: 'Events' }
    ]},
    { label: 'Evidence', items: [
      { id: 'analytics', href: 'analytics.html', icon: 'chart-no-axes-combined', text: 'Insights' },
      { id: 'audit',     href: 'audit.html',     icon: 'file-check-2', text: 'Decision record' }
    ]}
  ];

  var SYSTEM_ITEM = { id: 'settings', href: 'settings.html', icon: 'settings', text: 'Settings' };

  function iconHTML(name, className) {
    return '<i data-lucide="' + name + '"' + (className ? ' class="' + className + '"' : '') + ' aria-hidden="true"></i>';
  }

  function refreshIcons(root) {
    if (!window.lucide || typeof window.lucide.createIcons !== 'function') return;
    window.lucide.createIcons({ root: root || document });
  }
  window.refreshIcons = refreshIcons;

  var PANEL_SVG = iconHTML('panel-left');
  var PANEL_SVG_R = iconHTML('panel-right');

  function isActive(id) {
    return id === PAGE || (PAGE.indexOf(id + '-') === 0) ||
           (id === 'runs' && PAGE === 'run') ||
           (id === 'agents' && PAGE === 'agent');
  }

  /* ══════════════════ CHROME ══════════════════ */
  function buildTopbar(host) {
    host.innerHTML =
      '<div class="topbar-left">' +
        '<a href="fleet.html" class="product-mark"><span class="product-mark-icon">N</span><span>NALVO</span></a>' +
        '<div class="env-badge"><span class="env-dot"></span><span>Production</span></div>' +
      '</div>' +
      '<div style="display:flex; justify-content:center; flex:1;">' +
        '<input class="topbar-search" id="global-search" type="text" placeholder="Search workers, executions, connections…" aria-label="Global search">' +
      '</div>' +
      '<div class="topbar-right">' +
        '<a href="docs.html" class="topbar-link">Docs</a>' +
        '<a href="index.html" class="topbar-link">Website</a>' +
        '<div style="position:relative;">' +
          '<button class="avatar" id="acct-btn" aria-haspopup="true" aria-expanded="false" style="border:none; cursor:pointer; font-family:var(--font);">JD</button>' +
          '<div class="float-bar" id="acct-menu" style="right:0; top:34px; flex-direction:column; align-items:stretch; padding:6px; min-width:184px; gap:0;">' +
            '<div style="padding:8px 10px 10px; border-bottom:1px solid var(--border);">' +
              '<div style="font-size:12px; font-weight:600; color:var(--text-primary);">Jordan Diaz</div>' +
              '<div style="font-size:11px; color:var(--text-tertiary);">jordan@acme.io</div>' +
            '</div>' +
            '<a href="settings.html" class="acct-link">Settings</a>' +
            '<a href="settings-billing.html" class="acct-link">Billing</a>' +
            '<a href="settings-api.html" class="acct-link">API keys</a>' +
            '<a href="docs.html" class="acct-link">Documentation</a>' +
            '<a href="login.html" class="acct-link" style="color:var(--danger);">Sign out</a>' +
          '</div>' +
        '</div>' +
      '</div>';

    var style = document.createElement('style');
    style.textContent =
      '.acct-link{display:block;padding:7px 10px;border-radius:6px;font-size:12px;color:var(--text-secondary);' +
      'text-decoration:none;transition:background .12s ease,color .12s ease;}' +
      '.acct-link:hover{background:var(--surface-hover);color:var(--text-primary);}' +
      '#acct-menu{opacity:0;pointer-events:none;transform:translateY(-6px) scale(.97);}' +
      '#acct-menu.open{opacity:1;pointer-events:auto;transform:none;}';
    document.head.appendChild(style);

    var btn = host.querySelector('#acct-btn');
    var menu = host.querySelector('#acct-menu');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function () {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });

    var search = host.querySelector('#global-search');
    search.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var q = search.value.trim();
      if (!q) return;
      var local = document.querySelector('.main-content .filter-search');
      if (local) { local.value = q; applyFilter(local.closest('.filter-bar')); showToast('Filtered by “' + q + '”'); }
      else { window.location.href = 'fleet.html?q=' + encodeURIComponent(q); }
    });
  }

  function navItemHTML(it, cls) {
    return '<a href="' + it.href + '" class="' + cls + (isActive(it.id) ? ' active' : '') + '" data-page="' + it.id + '"' +
      (isActive(it.id) ? ' aria-current="page"' : '') + '>' +
      '<span class="icon">' + iconHTML(it.icon) + '</span> ' + it.text +
      (it.badge ? '<span class="nav-badge">' + it.badge + '</span>' : '') + '</a>';
  }

  function buildSidebar(host) {
    var html =
      '<div class="sidebar-head">' +
        '<div class="nav-label">Runtime</div>' +
        '<div class="panel-toggle" id="toggle-sidebar" role="button" tabindex="0" aria-label="Collapse navigation panel" title="Collapse panel">' + PANEL_SVG + '</div>' +
      '</div>';

    NAV.forEach(function (group, i) {
      html += '<div class="nav-section">';
      if (i > 0) html += '<div class="nav-label">' + group.label + '</div>';
      group.items.forEach(function (it) { html += navItemHTML(it, 'nav-item'); });
      html += '</div>';
    });

    html += '<div style="flex:1;"></div>' +
      '<div class="nav-section"><div class="nav-label">System</div>' + navItemHTML(SYSTEM_ITEM, 'nav-item') + '</div>' +
      '<div class="sidebar-footer">' +
        '<div class="nav-label">System Health</div>' +
        healthRow('CPU', '34%', 34, 'var(--success)') +
        healthRow('Memory', '62%', 62, 'var(--accent)') +
        healthRow('API/min', '1,247', 45, 'var(--info)') +
      '</div>';

    host.innerHTML = html;
  }

  function healthRow(label, value, pct, color) {
    return '<div class="health-row"><span class="health-label">' + label + '</span>' +
      '<span class="health-value">' + value + '</span></div>' +
      '<div class="health-bar"><div class="health-bar-fill" style="width:' + pct + '%; background:' + color + ';"></div></div>';
  }

  function buildFloatBars(left, right) {
    if (left) {
      var html = '';
      NAV[0].items.concat(NAV[1].items).slice(0, 6).forEach(function (it) {
        html += '<a href="' + it.href + '" class="bar-item' + (isActive(it.id) ? ' active' : '') + '" title="' + it.text + '">' + iconHTML(it.icon) + '</a>';
      });
      html += '<span class="bar-sep"></span>' +
        '<div class="bar-item" id="restore-sidebar" role="button" tabindex="0" aria-label="Show navigation panel" title="Expand panel">' + PANEL_SVG + '</div>';
      left.innerHTML = html;
    }
    if (right) {
      right.innerHTML = '<div class="bar-item" id="restore-panel" role="button" tabindex="0" aria-label="Show context panel" title="Expand panel">' + PANEL_SVG_R + '</div>';
    }
  }

  function buildPanelHead(host) {
    host.innerHTML = '<div class="panel-toggle" id="toggle-panel" role="button" tabindex="0" aria-label="Collapse context panel" title="Collapse panel">' + PANEL_SVG_R + '</div>';
  }

  /* ══════════════════ RESIZE / COLLAPSE ══════════════════ */
  var PANELS = {
    sidebar: { cssVar: '--sidebar-w', collapsedClass: 'sidebar-collapsed', dir: 1,  min: 168, max: 420, def: 200 },
    panel:   { cssVar: '--panel-w',   collapsedClass: 'panel-collapsed',   dir: -1, min: 280, max: 620, def: 380 }
  };

  function wirePanels() {
    var appEl = document.querySelector('.app');
    if (!appEl) return;

    function panelWidth(key) {
      return parseFloat(getComputedStyle(appEl).getPropertyValue(PANELS[key].cssVar)) || PANELS[key].def;
    }
    function setPanelWidth(key, px) {
      var p = PANELS[key];
      appEl.style.setProperty(p.cssVar, Math.min(p.max, Math.max(p.min, px)) + 'px');
    }
    function togglePanel(key) { appEl.classList.toggle(PANELS[key].collapsedClass); }

    document.querySelectorAll('.resizer').forEach(function (handle) {
      var key = handle.dataset.target;
      handle.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        var startX = e.clientX, startW = panelWidth(key);
        appEl.classList.add('resizing');
        handle.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        function onMove(ev) { setPanelWidth(key, startW + PANELS[key].dir * (ev.clientX - startX)); }
        function onUp() {
          appEl.classList.remove('resizing');
          handle.classList.remove('dragging');
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onUp);
        }
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
      });
      handle.addEventListener('dblclick', function () { setPanelWidth(key, PANELS[key].def); });
    });

    [['toggle-sidebar', 'sidebar'], ['toggle-panel', 'panel'],
     ['restore-sidebar', 'sidebar'], ['restore-panel', 'panel']].forEach(function (pair) {
      var btn = document.getElementById(pair[0]);
      if (!btn) return;
      btn.addEventListener('click', function () { togglePanel(pair[1]); });
      btn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePanel(pair[1]); }
      });
    });
  }

  /* ══════════════════ TOAST ══════════════════ */
  var toastTimer = null;
  function showToast(msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  window.showToast = showToast;

  window.toggleSetting = function (btn, name) {
    btn.classList.toggle('on');
    btn.setAttribute('aria-pressed', String(btn.classList.contains('on')));
    showToast(name + (btn.classList.contains('on') ? ' enabled' : ' disabled'));
  };

  /* ══════════════════ FILTERS ══════════════════ */
  function applyFilter(bar) {
    if (!bar) return;
    var scope = document.querySelector(bar.dataset.scope || '.main-content');
    var sel = bar.dataset.target;
    if (!scope || !sel) return;
    var tab = bar.querySelector('.filter-tab.active');
    var want = tab ? (tab.dataset.value || tab.textContent.trim().toLowerCase()) : 'all';
    var input = bar.querySelector('.filter-search');
    var q = input ? input.value.trim().toLowerCase() : '';
    var shown = 0;

    scope.querySelectorAll(sel).forEach(function (el) {
      var status = (el.dataset.status || '').toLowerCase();
      var tags = (el.dataset.tags || '').toLowerCase();
      var okTab = want === 'all' || status === want || tags.split(/\s+/).indexOf(want) > -1;
      var okQ = !q || el.textContent.toLowerCase().indexOf(q) > -1;
      var ok = okTab && okQ;
      el.style.display = ok ? '' : 'none';
      if (ok) shown++;
      if (!ok) el.classList.remove('expanded');
      if (!ok && el.tagName === 'TR') {
        var next = el.nextElementSibling;
        if (next && next.classList.contains('trace-row')) next.style.display = 'none';
      }
    });

    var counter = scope.querySelector('[data-filter-count]');
    if (counter) counter.textContent = counter.dataset.filterCount.replace('{n}', shown.toLocaleString('en-US'));

    var empty = scope.querySelector('[data-filter-empty]');
    if (empty) empty.style.display = shown ? 'none' : '';
  }
  window.applyFilter = applyFilter;

  function wireFilters() {
    document.querySelectorAll('.filter-bar[data-target]').forEach(function (bar) {
      bar.querySelectorAll('.filter-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
          bar.querySelectorAll('.filter-tab').forEach(function (t) { t.classList.toggle('active', t === tab); });
          applyFilter(bar);
        });
      });
      var input = bar.querySelector('.filter-search');
      if (input) input.addEventListener('input', function () { applyFilter(bar); });
      applyFilter(bar);
    });
  }

  /* ══════════════════ EXPANDABLE ROWS ══════════════════ */
  window.toggleRow = function (row) {
    var next = row.nextElementSibling;
    while (next && !next.classList.contains('trace-row')) next = next.nextElementSibling;
    if (next && next.classList.contains('trace-row')) {
      var hidden = next.style.display === 'none' || !next.style.display;
      next.style.display = hidden ? 'table-row' : 'none';
      row.classList.toggle('expanded', hidden);
    }
  };

  /* ══════════════════ MODALS ══════════════════ */
  window.openModal = function (id) {
    var m = document.getElementById(id);
    if (m) m.classList.add('open');
  };
  window.closeModal = function (id) {
    var m = document.getElementById(id);
    if (m) m.classList.remove('open');
  };
  function wireModals() {
    document.querySelectorAll('.modal-backdrop').forEach(function (b) {
      b.addEventListener('click', function (e) { if (e.target === b) b.classList.remove('open'); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') document.querySelectorAll('.modal-backdrop.open').forEach(function (b) { b.classList.remove('open'); });
    });
  }

  /* ══════════════════ SPARKLINES ══════════════════ */
  function buildSpark(poly, kind) {
    var W = 200, H = 48, N = 60;
    var s = 2166136261;
    for (var i = 0; i < kind.length; i++) s = ((s ^ kind.charCodeAt(i)) * 16777619) & 0x7fffffff;
    var rand = function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };

    var noise = function (len, amp) {
      var k = [];
      for (var i = 0, n = Math.ceil(N / len) + 2; i < n; i++) k.push(rand() * 2 - 1);
      return function (i) {
        var p = i / len, a = Math.floor(p), f = p - a, sm = f * f * (3 - 2 * f);
        return (k[a] * (1 - sm) + k[a + 1] * sm) * amp;
      };
    };

    var sample, band;
    if (kind === 'up') {
      var slow = noise(15, 0.34), mid = noise(6, 0.18), fast = noise(2, 0.08);
      sample = function (i) { var t = i / (N - 1); return t + slow(i) + mid(i) + fast(i); };
      band = [0.10, 0.92];
    } else if (kind === 'flat-high') {
      var slow2 = noise(11, 0.22), fast2 = noise(3, 0.10);
      var dips = [[0.13, 0.024, 0.30], [0.37, 0.032, 0.78], [0.55, 0.020, 0.22], [0.80, 0.038, 0.52]];
      sample = function (i) {
        var t = i / (N - 1), v = t * 0.30 + slow2(i) + fast2(i);
        for (var d = 0; d < dips.length; d++) {
          var dd = dips[d];
          v -= dd[2] * Math.exp(-((t - dd[0]) * (t - dd[0])) / (2 * dd[1] * dd[1]));
        }
        return v;
      };
      band = [0.34, 0.92];
    } else if (kind === 'down') {
      var slow3 = noise(17, 0.40), mid3 = noise(6, 0.16), fast3 = noise(2, 0.06);
      sample = function (i) { var t = i / (N - 1); return -t + slow3(i) + mid3(i) + fast3(i); };
      band = [0.12, 0.90];
    } else {
      var fast4 = noise(3, 0.11);
      var bursts = [[0.09, 0.60], [0.27, 0.92], [0.45, 0.50], [0.62, 0.74], [0.81, 0.38], [0.94, 0.24]];
      sample = function (i) {
        var t = i / (N - 1), v = -t * 0.60 + fast4(i);
        for (var b = 0; b < bursts.length; b++) {
          var d = t - bursts[b][0];
          if (d >= -0.03 && d <= 0.11) v += bursts[b][1] * (d < 0 ? (d + 0.03) / 0.03 : 1 - d / 0.11);
        }
        return v;
      };
      band = [0.08, 0.94];
    }

    var raw = [];
    for (var j = 0; j < N; j++) raw.push(sample(j));
    var lo = Math.min.apply(null, raw), span = (Math.max.apply(null, raw) - lo) || 1;
    var pts = raw.map(function (v, i) {
      var y = band[0] + ((v - lo) / span) * (band[1] - band[0]);
      return (i / (N - 1) * W).toFixed(1) + ',' + ((H - 2) - y * (H - 4)).toFixed(1);
    });
    poly.setAttribute('points', pts.join(' '));
    poly.style.stroke = (kind === 'down' || kind === 'spiky-down') ? 'var(--danger)' : 'var(--accent)';
  }

  /* ══════════════════ CHARTS ══════════════════ */
  // <svg data-chart="area|line|bar" data-series="..." data-series2="..." data-labels="Mon,Tue">
  // Rendered in real pixel space so axis labels stay crisp and strokes stay even.
  var chartUid = 0;

  function drawChart(svg) {
    var box = svg.getBoundingClientRect();
    var W = Math.max(240, Math.round(box.width));
    var H = Math.max(110, Math.round(box.height));
    if (!W || !H) return;

    var kind = svg.dataset.chart;
    var s1 = (svg.dataset.series || '').split(',').map(Number).filter(function (n) { return !isNaN(n); });
    var s2 = (svg.dataset.series2 || '').split(',').map(Number).filter(function (n) { return !isNaN(n); });
    var labels = (svg.dataset.labels || '').split(',');
    var dual = svg.dataset.dual === 'true';
    if (!s1.length) return;

    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.removeAttribute('preserveAspectRatio');

    var compactAxis = svg.dataset.chartCompact === 'true';
    var PAD_L = compactAxis ? 30 : 42;
    var PAD_R = compactAxis ? 6 : 12;
    var PAD_T = 12, PAD_B = labels.filter(Boolean).length ? 26 : 12;
    var iw = W - PAD_L - PAD_R, ih = H - PAD_T - PAD_B;

    var max1 = Math.max.apply(null, dual ? s1 : s1.concat(s2)) * 1.15 || 1;
    var max2 = s2.length ? Math.max.apply(null, s2) * 1.35 || 1 : 1;

    var x = function (i, n) { return PAD_L + (n < 2 ? iw / 2 : (i / (n - 1)) * iw); };
    var y = function (v, m) { return PAD_T + ih - (v / m) * ih; };

    var uid = 'g' + (++chartUid);
    var thinSolidBars = kind === 'bar';
    var out = thinSolidBars ? '' : '<defs><linearGradient id="' + uid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="var(--accent)" stop-opacity="0.14"/>' +
      '<stop offset="100%" stop-color="var(--accent)" stop-opacity="0.01"/></linearGradient></defs>';

    // Horizontal grid + left axis labels
    for (var g = 0; g <= 3; g++) {
      var gy = Math.round(PAD_T + (ih / 3) * g) + 0.5;
      out += '<line x1="' + PAD_L + '" y1="' + gy + '" x2="' + (W - PAD_R) + '" y2="' + gy +
             '" stroke="var(--border)" stroke-width="1"/>' +
             '<text x="' + (PAD_L - (compactAxis ? 6 : 10)) + '" y="' + (gy + 3.5) + '" text-anchor="end" ' +
             'fill="var(--text-disabled)" font-size="10" font-family="Inter, sans-serif">' +
             fmtShort(max1 - (max1 / 3) * g) + '</text>';
    }

    function line(series, m) {
      return series.map(function (v, i) {
        return (i ? 'L' : 'M') + x(i, series.length).toFixed(1) + ' ' + y(v, m).toFixed(1);
      }).join(' ');
    }

    if (kind === 'bar') {
      var bw = thinSolidBars ? Math.min(18, iw / s1.length * 0.34) : Math.min(34, iw / s1.length * 0.6);
      s1.forEach(function (v, i) {
        var by = y(v, max1);
        out += '<rect x="' + (x(i, s1.length) - bw / 2).toFixed(1) + '" y="' + by.toFixed(1) +
               '" width="' + bw.toFixed(1) + '" height="' + Math.max(1, PAD_T + ih - by).toFixed(1) +
               (thinSolidBars
                 ? '" rx="2" fill="var(--accent)"/>'
                 : '" rx="3" fill="url(#' + uid + ')" stroke="var(--accent)" stroke-width="1.25"/>');
      });
    } else {
      var d1 = line(s1, max1);
      if (kind === 'area') {
        out += '<path d="' + d1 + ' L' + x(s1.length - 1, s1.length).toFixed(1) + ' ' + (PAD_T + ih) +
               ' L' + PAD_L + ' ' + (PAD_T + ih) + ' Z" fill="url(#' + uid + ')"/>';
      }
      if (s2.length) {
        out += '<path d="' + line(s2, dual ? max2 : max1) + '" fill="none" stroke="var(--info)" ' +
               'stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>';
      }
      out += '<path d="' + d1 + '" fill="none" stroke="var(--accent)" stroke-width="2" ' +
             'stroke-linejoin="round" stroke-linecap="round"/>';
      out += s1.map(function (v, i) {
        return i === s1.length - 1
          ? '<circle cx="' + x(i, s1.length).toFixed(1) + '" cy="' + y(v, max1).toFixed(1) +
            '" r="3" fill="var(--accent)"/>' : '';
      }).join('');
    }

    labels.forEach(function (lab, i) {
      if (!lab) return;
      out += '<text x="' + x(i, labels.length).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" ' +
             'fill="var(--text-disabled)" font-size="10" font-family="Inter, sans-serif">' + lab + '</text>';
    });

    svg.innerHTML = out;
  }

  function fmtShort(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
    return Math.round(n).toString();
  }

  // <svg data-donut="40,25,20,15" data-donut-colors="var(--accent),...">
  function drawDonut(svg) {
    var vals = (svg.dataset.donut || '').split(',').map(Number).filter(function (n) { return !isNaN(n); });
    if (!vals.length) return;
    var colors = (svg.dataset.donutColors || 'var(--accent),#9BBF63,#5F7A8C,#3E4A3F,#2C2E2C').split(',');
    var total = vals.reduce(function (a, b) { return a + b; }, 0) || 1;
    var ringWidth = Math.max(6, Math.min(20, parseFloat(svg.dataset.ringWidth) || 16));
    var R = 54, C = 2 * Math.PI * R, off = 0, out = '';

    svg.setAttribute('viewBox', '0 0 140 140');
    out += '<circle cx="70" cy="70" r="' + R + '" fill="none" stroke="var(--surface-raised)" stroke-width="' + ringWidth + '"/>';
    vals.forEach(function (v, i) {
      var len = (v / total) * C;
      out += '<circle cx="70" cy="70" r="' + R + '" fill="none" stroke="' + colors[i % colors.length].trim() +
             '" stroke-width="' + ringWidth + '" stroke-dasharray="' + (len - 2).toFixed(1) + ' ' + (C - len + 2).toFixed(1) +
             '" stroke-dashoffset="' + (-off).toFixed(1) + '" transform="rotate(-90 70 70)"/>';
      off += len;
    });
    if (svg.dataset.donutLabel) {
      out += '<text x="70" y="68" text-anchor="middle" fill="var(--text-primary)" font-size="18" font-weight="600" font-family="Inter, sans-serif">' +
             svg.dataset.donutLabel + '</text>';
      out += '<text x="70" y="84" text-anchor="middle" fill="var(--text-tertiary)" font-size="9" font-family="Inter, sans-serif">' +
             (svg.dataset.donutSub || '') + '</text>';
    }
    svg.innerHTML = out;
  }

  /* ══════════════════ SYNTHETIC RUN HISTORY ══════════════════ */
  var _seed = 42;
  function rnd() { _seed = (_seed * 1103515245 + 12345) & 0x7fffffff; return _seed / 0x7fffffff; }
  function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
  window.opRnd = rnd;

  var RUN_AGENTS = ['invoice-parser-v2', 'onboarding-agent', 'compliance-checker', 'data-sync-pipeline',
    'security-audit-bot', 'pricing-optimizer', 'email-classifier', 'report-generator', 'contract-renewal-bot'];
  var RUN_TRIGGERS = ['schedule', 'webhook', 'api call', 'event', 'manual'];

  function fmtDur(sec) {
    var h = String(Math.floor(sec / 3600)).padStart(2, '0');
    var m = String(Math.floor(sec % 3600 / 60)).padStart(2, '0');
    var s = String(Math.floor(sec % 60)).padStart(2, '0');
    return h + ':' + m + ':' + s;
  }

  function generateRuns() {
    var tbody = document.getElementById('runs-tbody');
    if (!tbody) return;
    var frag = document.createDocumentFragment();
    var TOTAL = 2847;
    var existing = tbody.querySelectorAll('tr').length;

    for (var i = 0; i < TOTAL - existing; i++) {
      var num = 8281 - i;
      var day = Math.floor(Math.pow(rnd(), 1.4) * 30);
      var d = 3 - day;
      var dateStr = d >= 1 ? 'Aug ' + d : 'Jul ' + (31 + d);
      var time = String(Math.floor(rnd() * 24)).padStart(2, '0') + ':' + String(Math.floor(rnd() * 60)).padStart(2, '0');
      var agent = pick(RUN_AGENTS);
      var trigger = pick(RUN_TRIGGERS);
      var tokens = Math.floor(rnd() * 26000) + 100;
      var cost = '$' + (tokens * 0.00009).toFixed(2);
      var dur = fmtDur(rnd() * 2700 + 20);

      var status, scls, r = rnd();
      if (day === 0 && r < 0.12)      { status = 'Running'; scls = 'running'; }
      else if (day === 0 && r < 0.16) { status = 'Waiting'; scls = 'waiting'; }
      else if (r < 0.09)              { status = 'Failed';  scls = 'failed'; }
      else                            { status = 'Done';    scls = 'done'; }

      var tr = document.createElement('tr');
      tr.dataset.day = day;
      tr.dataset.status = scls;
      tr.dataset.tags = day === 0 ? 'today last7d' : (day === 1 ? 'yesterday last7d' : (day <= 6 ? 'last7d' : ''));
      tr.className = 'clickable';
      tr.innerHTML = '<td class="tnum">#' + num + '</td>' +
        '<td><div class="agent-name">' + agent + '</div></td>' +
        '<td>' + trigger + '</td>' +
        '<td class="tnum">' + dateStr + ', ' + time + '</td>' +
        '<td class="tnum">' + dur + '</td>' +
        '<td class="tnum">' + tokens.toLocaleString('en-US') + '</td>' +
        '<td class="tnum">' + cost + '</td>' +
        '<td><span class="status status-' + scls + '"><span class="dot"></span>' + status + '</span></td>';
      frag.appendChild(tr);
    }
    tbody.appendChild(frag);
    var note = document.getElementById('runs-loaded');
    if (note) note.textContent = 'All ' + TOTAL.toLocaleString('en-US') + ' runs loaded — scroll freely';
  }

  var STEP_POOL = ['fetch_data', 'extract_entities', 'validate_schema', 'transform_records', 'call_tool',
    'llm_summarize', 'write_output', 'notify_channel', 'archive_results', 'generate_report'];

  function selectRun(row) {
    var cells = row.querySelectorAll('td');
    if (cells.length < 8) return;
    var num = cells[0].textContent.trim(), agent = cells[1].textContent.trim(),
        trigger = cells[2].textContent.trim(), started = cells[3].textContent.trim(),
        duration = cells[4].textContent.trim(), tokens = cells[5].textContent.trim(),
        cost = cells[6].textContent.trim();
    var statusEl = cells[7].querySelector('.status');
    var status = statusEl ? statusEl.textContent.trim() : 'Done';

    document.querySelectorAll('#runs-tbody tr').forEach(function (r) { r.classList.toggle('selected', r === row); });

    var titles = { schedule: 'Scheduled batch processing', webhook: 'Webhook-triggered run', 'api call': 'API-triggered run', event: 'Event-driven run', manual: 'Manually started run' };
    set('rund-meta', agent + ' · Run ' + num);
    set('rund-title', titles[trigger] || 'Agent run');
    set('rund-sub', 'Run ' + num + ' by ' + agent + ', started ' + started + ' via ' + trigger + '.');
    var st = document.getElementById('rund-status');
    if (st) {
      st.textContent = status;
      st.style.color = status === 'Failed' ? 'var(--danger)' : status === 'Done' ? 'var(--success)' : 'var(--accent-text)';
    }
    set('rund-trigger', trigger);
    set('rund-started', started + ' UTC');
    set('rund-duration', duration);
    set('rund-tokens', tokens);
    set('rund-cost', cost);
    set('rund-version', 'v' + (1 + Math.floor(rnd() * 3)) + '.' + Math.floor(rnd() * 9) + '.' + Math.floor(rnd() * 9));

    var open = document.getElementById('rund-open');
    if (open) open.href = 'run.html?id=' + num.replace('#', '');

    var steps = document.getElementById('rund-steps');
    if (steps) {
      var nSteps = 3 + Math.floor(rnd() * 3);
      var html = '<div style="position:absolute; left:5px; top:6px; bottom:6px; width:1px; background:var(--border-light);"></div>';
      for (var i = 0; i < nSteps; i++) {
        var cls = status === 'Done' ? 'completed' : (i === nSteps - 1 ? 'active' : 'completed');
        html += '<div class="step-item ' + cls + '"><div class="step-dot"></div><div class="step-content">' +
          '<div class="step-title">' + pick(STEP_POOL) + '</div>' +
          '<div class="step-duration">' + (rnd() * 8).toFixed(1) + 's · ' +
          (Math.floor(rnd() * 4000) + 50).toLocaleString('en-US') + ' tokens</div></div></div>';
      }
      steps.innerHTML = html;
    }
  }

  window.opSelectRun = selectRun;

  function set(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }
  window.opSet = set;

  /* ══════════════════ BOOT ══════════════════ */
  function boot() {
    var topbar = document.querySelector('[data-topbar]');
    if (topbar) buildTopbar(topbar);
    var sidebar = document.querySelector('[data-sidebar]');
    if (sidebar) buildSidebar(sidebar);
    buildFloatBars(document.querySelector('[data-floatbar-left]'), document.querySelector('[data-floatbar-right]'));
    var ph = document.querySelector('.panel-head');
    if (ph && !ph.children.length) buildPanelHead(ph);

    wirePanels();
    wireModals();

    document.querySelectorAll('.metric-sparkline polyline[data-trend]').forEach(function (p) { buildSpark(p, p.dataset.trend); });
    document.querySelectorAll('svg[data-chart]').forEach(drawChart);
    document.querySelectorAll('svg[data-donut]').forEach(drawDonut);

    var redrawTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(redrawTimer);
      redrawTimer = setTimeout(function () {
        document.querySelectorAll('svg[data-chart]').forEach(drawChart);
      }, 140);
    });

    generateRuns();
    document.querySelectorAll('#runs-tbody tr').forEach(function (r) {
      r.classList.add('clickable');
      r.addEventListener('click', function () { selectRun(r); });
    });

    wireFilters();

    // query param prefill: fleet.html?q=…
    var q = new URLSearchParams(window.location.search).get('q');
    if (q) {
      var inp = document.querySelector('.main-content .filter-search');
      if (inp) { inp.value = q; applyFilter(inp.closest('.filter-bar')); }
    }

    document.querySelectorAll('[data-toast]').forEach(function (el) {
      el.addEventListener('click', function () { showToast(el.dataset.toast); });
    });

    refreshIcons();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
