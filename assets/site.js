/* ════════════════════════════════════════════════════════════════
   NALVO — public site runtime
   Header injection · mobile nav · pricing toggle · scroll spy
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var PAGE = document.body.dataset.page || '';

  function iconHTML(name, className) {
    return '<i data-lucide="' + name + '"' + (className ? ' class="' + className + '"' : '') + ' aria-hidden="true"></i>';
  }

  function refreshIcons(root) {
    if (!window.lucide || typeof window.lucide.createIcons !== 'function') return;
    window.lucide.createIcons({ root: root || document });
  }
  window.refreshIcons = refreshIcons;

  var NAV = [
    { id: 'product',  href: 'product.html',  text: 'Product' },
    { id: 'pricing',  href: 'pricing.html',  text: 'Pricing' },
    { id: 'docs',     href: 'docs.html',     text: 'Docs' },
    { id: 'changelog', href: 'changelog.html', text: 'Changelog' }
  ];

  function isActive(id) { return PAGE === id || PAGE.indexOf(id + '-') === 0; }

  function buildHeader(host) {
    var links = NAV.map(function (n) {
      return '<a href="' + n.href + '"' + (isActive(n.id) ? ' class="active" aria-current="page"' : '') + '>' + n.text + '</a>';
    }).join('');

    host.innerHTML =
      '<div class="container">' +
        '<div class="header-bar">' +
          '<a class="brand" href="index.html"><span class="mark">N</span><span class="name">NALVO</span></a>' +
          '<nav class="site-nav">' + links + '</nav>' +
          '<button class="nav-toggle" aria-label="Toggle navigation" aria-expanded="false">' + iconHTML('menu') + '</button>' +
          '<div class="header-actions">' +
            '<a class="ghost" href="login.html">Sign in</a>' +
            '<a class="btn btn-lime btn-sm" href="signup.html">Start free' + iconHTML('arrow-right', 'arrow') + '</a>' +
          '</div>' +
        '</div>' +
      '</div>';

    var toggle = host.querySelector('.nav-toggle');
    toggle.addEventListener('click', function () {
      var open = host.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.innerHTML = iconHTML(open ? 'x' : 'menu');
      refreshIcons(toggle);
    });
  }

  function buildFooter(host) {
    host.innerHTML =
      '<div class="container">' +
        '<div class="footer-grid">' +
          '<div class="footer-brand">' +
            '<a class="brand" href="index.html"><span class="mark">N</span><span class="name">NALVO</span></a>' +
            '<p>Autonomous work, held to account. Inspect every execution, set checkpoints and preserve the evidence.</p>' +
          '</div>' +
          '<div class="footer-col"><h4>Product</h4>' +
            '<a href="product.html">Overview</a><a href="product.html#control">Live map</a>' +
            '<a href="product.html#approvals">Checkpoints</a><a href="pricing.html">Pricing</a>' +
            '<a href="changelog.html">Changelog</a></div>' +
          '<div class="footer-col"><h4>Developers</h4>' +
            '<a href="docs.html">Documentation</a><a href="docs-quickstart.html">Quickstart</a>' +
            '<a href="docs-api.html">API reference</a><a href="docs-webhooks.html">Webhooks</a>' +
            '<a href="docs-cli.html">CLI</a></div>' +
          '<div class="footer-col"><h4>Workspace</h4>' +
            '<a href="login.html">Sign in</a><a href="signup.html">Create account</a>' +
            '<a href="fleet.html">Live demo</a><a href="forgot-password.html">Reset password</a></div>' +
          '<div class="footer-col"><h4>Company</h4>' +
            '<a href="index.html#contact">Contact</a><a href="docs-security.html">Security</a>' +
            '<a href="#">Privacy</a><a href="#">Terms</a></div>' +
        '</div>' +
        '<div class="footer-bottom">' +
          '<span>© 2026 Nalvo Systems. All rights reserved.</span>' +
          '<span>SOC 2 Type II · GDPR ready · Hosted in EU and US regions</span>' +
        '</div>' +
      '</div>';
  }

  var DOCS_NAV = [
    { label: 'Getting started', items: [
      { id: 'docs',            href: 'docs.html',            text: 'Overview' },
      { id: 'docs-quickstart', href: 'docs-quickstart.html', text: 'Quickstart' },
      { id: 'docs-concepts',   href: 'docs-concepts.html',   text: 'Core concepts' }
    ]},
    { label: 'Guides', items: [
      { id: 'docs-approvals', href: 'docs-approvals.html', text: 'Decision checkpoints' },
      { id: 'docs-tools',     href: 'docs-tools.html',     text: 'Connections' },
      { id: 'docs-webhooks',  href: 'docs-webhooks.html',  text: 'Webhooks' }
    ]},
    { label: 'Reference', items: [
      { id: 'docs-api',      href: 'docs-api.html',      text: 'REST API' },
      { id: 'docs-cli',      href: 'docs-cli.html',      text: 'CLI' },
      { id: 'docs-security', href: 'docs-security.html', text: 'Security & compliance' }
    ]}
  ];

  function buildDocsNav(host) {
    host.innerHTML = DOCS_NAV.map(function (group) {
      return '<h4>' + group.label + '</h4>' + group.items.map(function (it) {
        return '<a href="' + it.href + '"' + (PAGE === it.id ? ' class="active" aria-current="page"' : '') + '>' + it.text + '</a>';
      }).join('');
    }).join('');
  }

  function wirePricingToggle() {
    var toggle = document.getElementById('billing-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      toggle.querySelectorAll('button').forEach(function (b) { b.classList.toggle('active', b === btn); });
      var annual = btn.dataset.cycle === 'annual';
      document.querySelectorAll('[data-monthly]').forEach(function (el) {
        el.firstChild.nodeValue = annual ? el.dataset.annual : el.dataset.monthly;
      });
      document.querySelectorAll('[data-cycle-note]').forEach(function (el) {
        el.textContent = annual ? 'billed annually · 2 months free' : 'billed monthly';
      });
    });
  }

  function wireScrollSpy() {
    var toc = document.querySelector('.docs-toc');
    if (!toc) return;
    var links = Array.prototype.slice.call(toc.querySelectorAll('a'));
    var targets = links.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
    if (!targets.length) return;

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + entry.target.id;
          a.style.color = on ? 'var(--ink)' : 'var(--ink-2)';
          a.style.fontWeight = on ? '600' : '400';
        });
      });
    }, { rootMargin: '-80px 0px -70% 0px' });

    targets.forEach(function (t) { obs.observe(t); });
  }

  function wireManifestoInk() {
    var manifesto = document.querySelector('.manifesto');
    if (!manifesto) return;
    var section = manifesto.closest('.manifesto-section');
    if (!section) return;
    var sticky = manifesto.closest('.container');
    if (!sticky) return;

    var text = manifesto.textContent.replace(/\s+/g, ' ').trim();
    manifesto.textContent = '';
    manifesto.setAttribute('aria-label', text);

    var fragment = document.createDocumentFragment();
    Array.prototype.forEach.call(text, function (letter) {
      var span = document.createElement('span');
      span.className = 'manifesto-char';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = letter;
      fragment.appendChild(span);
    });
    manifesto.appendChild(fragment);

    var letters = Array.prototype.slice.call(manifesto.querySelectorAll('.manifesto-char'));
    var ticking = false;

    function paint() {
      var rect = section.getBoundingClientRect();
      var scrollRange = Math.max(1, rect.height - sticky.getBoundingClientRect().height);
      var progress = Math.max(0, Math.min(1, -rect.top / scrollRange));
      var inkCount = Math.round(progress * letters.length);

      letters.forEach(function (letter, index) {
        letter.classList.toggle('is-ink', index < inkCount);
      });
      ticking = false;
    }

    function requestPaint() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(paint);
    }

    window.addEventListener('scroll', requestPaint, { passive: true });
    window.addEventListener('resize', requestPaint);
    paint();
  }

  // Live console embeds — scale a real 1440px app view down to the container
  function fitShots() {
    document.querySelectorAll('.shot').forEach(function (shot) {
      var frame = shot.querySelector('iframe');
      if (!frame) return;
      var w = parseFloat(frame.getAttribute('width')) || 1440;
      var h = parseFloat(frame.getAttribute('height')) || 812;
      frame.style.width = w + 'px';
      frame.style.height = h + 'px';
      shot.style.aspectRatio = w + ' / ' + h;
      shot.style.setProperty('--k', (shot.clientWidth / w).toFixed(4));
    });
  }

  function wireShots() {
    if (!document.querySelector('.shot')) return;
    fitShots();
    var t = null;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(fitShots, 120);
    });
    window.addEventListener('load', fitShots);
  }

  function wireCopy() {
    document.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pre = btn.closest('.code').querySelector('pre');
        if (navigator.clipboard && pre) navigator.clipboard.writeText(pre.textContent).catch(function () {});
        var old = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = old; }, 1400);
      });
    });
  }

  function wireFaqIcons() {
    document.querySelectorAll('.faq details').forEach(function (details) {
      var summary = details.querySelector('summary');
      if (!summary) return;
      var holder = document.createElement('span');
      holder.className = 'faq-icon';
      holder.innerHTML = iconHTML(details.open ? 'minus' : 'plus');
      summary.appendChild(holder);
      details.addEventListener('toggle', function () {
        holder.innerHTML = iconHTML(details.open ? 'minus' : 'plus');
        refreshIcons(holder);
      });
    });
  }

  function boot() {
    var header = document.querySelector('.site-header');
    if (header) buildHeader(header);
    var footer = document.querySelector('.site-footer');
    if (footer && !footer.children.length) buildFooter(footer);
    var docsNav = document.querySelector('[data-docs-nav]');
    if (docsNav) buildDocsNav(docsNav);
    wirePricingToggle();
    wireScrollSpy();
    wireManifestoInk();
    wireShots();
    wireCopy();
    wireFaqIcons();
    refreshIcons();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
