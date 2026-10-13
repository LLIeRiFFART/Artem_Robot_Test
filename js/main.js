/**
 * main.js — scripts shared by every page.
 *
 *  1. Helpers
 *  2. HTML templates (robot illustration, product card, post card, FAQ)
 *  3. Scroll reveal & counters
 *  4. Header & mobile menu
 *  5. Cart & toast
 *  6. Global click handling, forms
 *  7. 3D helper
 *  8. Page renderers: catalog, product, blog, article, support, contact
 *  9. Init (chooses what to run from <body data-page="...">)
 *
 * Requires js/icons.js and js/data.js to be loaded before this file.
 */
'use strict';

/* ==========================================================================
   1. Helpers
   ========================================================================== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const ic = (name, cls = '') => `<svg class="i ${cls}"><use href="#i-${name}"/></svg>`;
const fmt = n => '$' + Math.round(n).toLocaleString('en-US');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const px = (id, w = 1200, h = 700) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=${h}&w=${w}`;
const getItem = id => MODELS.find(m => m.id === id) || ACC.find(a => a.id === id);

const PAGE = document.body.dataset.page;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;


/* ==========================================================================
   2. HTML templates
   ========================================================================== */

// Flat vector illustration of a robot, coloured per model.
let svgUid = 0;
function robotSVG(m) {
  const id = 'rg' + (++svgUid);
  const c = m.color;
  return `<svg viewBox="0 0 200 200" aria-hidden="true"><defs>
    <radialGradient id="${id}a" cx=".32" cy=".22" r=".95"><stop offset="0" stop-color="${c.hi}"/><stop offset=".5" stop-color="${c.shell}"/><stop offset="1" stop-color="${c.deco}"/></radialGradient>
    <radialGradient id="${id}b" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="#2b2e56"/><stop offset="1" stop-color="#0a0b1b"/></radialGradient>
    <filter id="${id}s" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="5"/></filter></defs>
    <ellipse cx="100" cy="170" rx="66" ry="9" fill="rgba(40,20,120,.38)" filter="url(#${id}s)"/>
    <ellipse cx="100" cy="114" rx="84" ry="66" fill="${c.deco}"/>
    <ellipse cx="100" cy="102" rx="84" ry="66" fill="url(#${id}a)"/>
    <ellipse cx="100" cy="102" rx="66" ry="50" fill="url(#${id}b)"/>
    <path d="M44 92a60 45 0 0 1 112 0" fill="none" stroke="${c.accent}" stroke-width="2" stroke-linecap="round" opacity=".9"/>
    <ellipse cx="100" cy="94" rx="19" ry="14" fill="#0a0b1b"/><rect x="81" y="84" width="38" height="10" fill="#1b1e3a"/>
    <ellipse cx="100" cy="84" rx="19" ry="14" fill="#30346a"/><ellipse cx="100" cy="84" rx="11" ry="8" fill="${c.accent}" opacity=".92"/>
    <circle cx="100" cy="122" r="3.2" fill="${c.accent}"/><circle cx="86" cy="119" r="2" fill="rgba(255,255,255,.5)"/><circle cx="114" cy="119" r="2" fill="rgba(255,255,255,.5)"/></svg>`;
}

function cardHTML(m) {
  const link = `product.html?id=${m.id}`;
  const badges = [
    `<span>${m.pa.toLocaleString()} Pa</span>`,
    `<span>${m.runtime} min</span>`,
    m.mop ? '<span>Mop</span>' : '',
    m.station >= 2 ? '<span>Self-washing</span>' : m.station === 1 ? '<span>Auto-empty</span>' : '',
    m.pets ? '<span>Pet-ready</span>' : ''
  ].join('');
  return `<article class="pcard">
    <a class="pic" href="${link}" aria-label="${m.name}">${robotSVG(m)}<span class="tagp">${m.tag}</span></a>
    <div class="info">
      <div class="flex items-start justify-between gap-2">
        <h3 class="h3" style="margin:0"><a href="${link}">Lunevo ${m.name}</a></h3>
        <span class="flex items-center gap-1 text-xs font-bold" style="color:#b88700;white-space:nowrap">${ic('star')}4.${6 + m.tier % 3}</span>
      </div>
      <div class="meta">${badges}</div>
      <p class="text-sm mut" style="margin:0">${m.short}</p>
      <div class="foot">
        <div class="price">${fmt(m.price)}${m.old ? `<s>${fmt(m.old)}</s>` : ''}</div>
        <div class="flex items-center gap-2">
          <button class="icon-btn" type="button" data-add="${m.id}" aria-label="Add ${m.name} to cart">${ic('cart')}</button>
          <a class="go" href="${link}" aria-label="View ${m.name}">${ic('arrow')}</a>
        </div>
      </div>
    </div>
  </article>`;
}

function accHTML(a) {
  return `<div class="card lift rv" style="padding:var(--pad-card);display:flex;flex-direction:column;gap:.9rem;height:100%">
    <div class="tile tile--ink" style="width:3rem;height:3rem;border-radius:16px">${ic(a.icon)}</div>
    <div><h3 class="h3" style="margin:0 0 .3rem;font-size:1.05rem">${a.name}</h3><p class="text-sm mut" style="margin:0">${a.desc}</p></div>
    <div class="flex items-center justify-between mt-auto pt-2">
      <b class="display" style="font-size:1.2rem">${fmt(a.price)}</b>
      <button class="btn btn-dark btn-sm" type="button" data-add="${a.id}">Add <span class="ico">${ic('plus')}</span></button>
    </div>
  </div>`;
}

function postCard(p, delay = 0) {
  return `<a class="post rv" href="article.html?id=${p.id}" style="--d:${delay}s">
    <div class="ph"><img src="${px(p.img, 900, 560)}" alt="${p.title}" loading="lazy"><span class="tagp">${p.cat}</span></div>
    <div class="bd">
      <span class="text-xs mut font-bold">${p.date} · ${p.read} read</span>
      <h3 class="h3" style="margin:0">${p.title}</h3>
      <p class="text-sm mut" style="margin:0">${p.ex}</p>
      <span class="more">Read article ${ic('arrow')}</span>
    </div>
  </a>`;
}

function renderFaq(el, limit) {
  if (!el) return;
  el.innerHTML = FAQS.slice(0, limit || FAQS.length).map((f, i) => `
    <div class="faq rv" style="--d:${(i % 4) * .05}s">
      <button type="button" aria-expanded="false"><span>${f[0]}</span><span class="pm">${ic('plus')}</span></button>
      <div class="ans"><div><p>${f[1]}</p></div></div>
    </div>`).join('');
}


/* ==========================================================================
   3. Scroll reveal & counters
   ========================================================================== */
let revealObserver = null;

// After the animation ends the .rv classes are removed so hover transitions work normally.
function revealEl(el) {
  el.classList.add('in');
  const delay = parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0;
  setTimeout(() => el.classList.remove('rv', 'in', 'rv-l', 'rv-r', 'rv-s'), (0.9 + delay) * 1000 + 300);
}

if ('IntersectionObserver' in window) {
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        revealObserver.unobserve(e.target);
        revealEl(e.target);
      }
    });
  }, { threshold: .08, rootMargin: '0px 0px -4% 0px' });
}

function observeReveals(root = document) {
  $$('.rv', root).forEach(el => {
    if (!revealObserver) { el.classList.remove('rv'); return; }
    if (!el.dataset.ob) {
      el.dataset.ob = '1';
      revealObserver.observe(el);
    }
  });
}

function countUp(el) {
  const end = +el.dataset.count;
  const decimals = +(el.dataset.dec || 0);
  const grouped = el.dataset.fmt;
  const suffix = el.dataset.suf || '';
  const start = performance.now();
  const duration = 1700;
  (function step(now) {
    const k = clamp((now - start) / duration, 0, 1);
    const v = end * (1 - Math.pow(1 - k, 3));
    el.textContent = (decimals ? v.toFixed(decimals) : grouped ? Math.round(v).toLocaleString('en-US') : Math.round(v)) + suffix;
    if (k < 1) requestAnimationFrame(step);
  })(start);
}

const counterObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { counterObserver.unobserve(e.target); countUp(e.target); }
      });
    }, { threshold: .6 })
  : null;

// light follows the cursor on .spot cards
document.addEventListener('mousemove', e => {
  const spot = e.target.closest && e.target.closest('.spot');
  if (!spot) return;
  const r = spot.getBoundingClientRect();
  spot.style.setProperty('--mx', (e.clientX - r.left) + 'px');
  spot.style.setProperty('--my', (e.clientY - r.top) + 'px');
}, { passive: true });


/* ==========================================================================
   4. Header & mobile menu
   ========================================================================== */
const mobileNav = $('#mnav');

function toggleMenu(open) {
  mobileNav.classList.toggle('open', open);
  mobileNav.setAttribute('aria-hidden', !open);
  document.body.style.overflow = open ? 'hidden' : '';
}

$('#burger').addEventListener('click', () => toggleMenu(true));
$('#mclose').addEventListener('click', () => toggleMenu(false));
mobileNav.addEventListener('click', e => { if (e.target.closest('a')) toggleMenu(false); });

let scrollTicking = false;
function onScroll() {
  $('#hdr').classList.toggle('sc', scrollY > 20);
}
addEventListener('scroll', () => {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => { scrollTicking = false; onScroll(); });
}, { passive: true });


/* ==========================================================================
   5. Cart & toast
   ========================================================================== */
let CART = [];
try {
  CART = JSON.parse(localStorage.getItem('lv_cart') || '[]').filter(i => getItem(i.id));
} catch (e) {
  CART = [];
}

function saveCart() {
  try { localStorage.setItem('lv_cart', JSON.stringify(CART)); } catch (e) { /* storage unavailable */ }
}

function cartTotals() {
  let robots = 0, acc = 0, count = 0, hasRobot = false;
  CART.forEach(i => {
    const it = getItem(i.id);
    count += i.qty;
    if (it.tier) { robots += it.price * i.qty; hasRobot = true; }
    else acc += it.price * i.qty;
  });
  const save = hasRobot ? acc * .1 : 0;
  return { robots, acc, save, total: robots + acc - save, count, hasRobot };
}

function renderCart() {
  const t = cartTotals();
  const box = $('#cartItems');
  $('#cartN').textContent = t.count ? `(${t.count})` : '';
  const badge = $('#cartCount');
  badge.textContent = t.count;
  badge.classList.toggle('has', t.count > 0);

  if (!CART.length) {
    box.innerHTML = `<div style="text-align:center;padding:60px 10px">
      <div class="tile" style="width:4.5rem;height:4.5rem;border-radius:50%;background:#f0edff;margin:0 auto 1rem;color:var(--violet)">${ic('cart')}</div>
      <h4 class="h3">Your cart is empty</h4>
      <p class="mut text-sm mt-2">Find the robot that fits your home in one minute.</p>
      <a href="index.html#finder" class="btn btn-lime btn-sm mt-5">Open the finder <span class="ico">${ic('arrow')}</span></a>
    </div>`;
  } else {
    box.innerHTML = CART.map(i => {
      const it = getItem(i.id);
      const thumb = it.tier ? robotSVG(it) : `<span style="color:var(--violet)">${ic(it.icon)}</span>`;
      return `<div class="cart-item">
        <div class="th cart-svg">${thumb}</div>
        <div class="min-w-0">
          <b class="display text-sm" style="display:block;line-height:1.2">${it.tier ? 'Lunevo ' : ''}${it.name}</b>
          <span class="text-xs mut">${fmt(it.price)}</span>
          <div class="mt-2"><div class="qty">
            <button type="button" data-q="${i.id}" data-d="-1" aria-label="Decrease">${ic('minus')}</button>
            <span>${i.qty}</span>
            <button type="button" data-q="${i.id}" data-d="1" aria-label="Increase">${ic('plus')}</button>
          </div></div>
        </div>
        <div class="text-right">
          <b class="display">${fmt(it.price * i.qty)}</b><br>
          <button type="button" class="text-xs mut font-bold" style="text-decoration:underline" data-rm="${i.id}">Remove</button>
        </div>
      </div>`;
    }).join('');
  }

  $('#cartTotal').textContent = fmt(t.total);

  // progress towards the free spare kit
  const goal = 900;
  const left = goal - t.total;
  $('#shipBar').style.width = clamp(t.total / goal * 100, 0, 100) + '%';
  $('#shipTxt').textContent = !CART.length
    ? 'Free delivery & free 30-day returns on every order.'
    : left > 0
      ? `Add ${fmt(left)} more to unlock a free spare kit ($39).`
      : 'Free spare kit unlocked — we’ll add it at checkout.';

  const checkout = $('#checkout');
  checkout.disabled = !CART.length;
  checkout.style.opacity = CART.length ? 1 : .5;
}

let toastTimer;
function toast(message) {
  const el = $('#toast');
  $('#toastT').textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

function openCart(open = true) {
  $('#cart').classList.toggle('open', open);
  $('#ov').classList.toggle('open', open);
  $('#cart').setAttribute('aria-hidden', !open);
  document.body.style.overflow = open ? 'hidden' : '';
}

function addCart(id, qty = 1, opts = {}) {
  const found = CART.find(i => i.id === id);
  if (found) found.qty = Math.min(9, found.qty + qty);
  else CART.push({ id, qty });
  saveCart();
  renderCart();
  if (!opts.silent) {
    const it = getItem(id);
    toast(`${it.tier ? 'Lunevo ' : ''}${it.name} added to cart`);
    openCart(true);
  }
}

$('#cartBtn').addEventListener('click', () => openCart(true));
$('#cartClose').addEventListener('click', () => openCart(false));
$('#ov').addEventListener('click', () => openCart(false));
$('#checkout').addEventListener('click', () => {
  openCart(false);
  toast('Demo store — checkout is disabled in this preview');
});


/* ==========================================================================
   6b. Anchor scrolling
   --------------------------------------------------------------------------
   Native "#id" jumps land in the wrong place on this site: images, fonts and
   the pinned 3D section change the page height while the browser is still
   scrolling. So we scroll ourselves and re-align once the layout has settled.
   ========================================================================== */
function anchorTarget(hash) {
  try { return hash.length > 1 ? document.querySelector(hash) : null; } catch (e) { return null; }
}

let anchorToken = 0;
function goToAnchor(hash, instant = false) {
  const el = anchorTarget(hash);
  if (!el) return;
  const token = ++anchorToken;
  el.scrollIntoView({ behavior: instant ? 'instant' : 'smooth', block: 'start' });
  // after the animation / layout shifts: snap to the exact position if we are off
  [instant ? 300 : 900, 1800, 3200].forEach(ms => setTimeout(() => {
    if (token !== anchorToken) return;
    const el2 = anchorTarget(hash);
    if (!el2) return;
    const want = parseFloat(getComputedStyle(el2).scrollMarginTop) || 0;
    if (Math.abs(el2.getBoundingClientRect().top - want) > 3) el2.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, ms));
}

// user input cancels any pending re-alignment
['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(ev =>
  addEventListener(ev, () => { anchorToken++; }, { passive: true }));

// arriving from another page (index.html#finder): align after load, then re-check
if (location.hash.length > 1) {
  const hashGo = () => goToAnchor(location.hash, true);
  if (document.readyState === 'complete') hashGo(); else addEventListener('load', hashGo, { once: true });
}


/* ---------- Active state of the header links on the home page ----------
   Technology / Find yours / Compare get the same black pill as "Robots" does
   on its own page: on click, and while their section is on screen. */
const NAV_LINKS = $$('.nav a[href*="#"]');
let navLock = 0, navLockTimer = 0;

function navMark(hash, fromClick = false) {
  NAV_LINKS.forEach(a => {
    const on = !!hash && new URL(a.getAttribute('href'), location.href).hash === hash;
    a.classList.toggle('on', on);
    if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
  });
  if (fromClick) navLock = Date.now() + 1500;   // do not let the scroll-spy flicker during smooth scrolling
}

function navSpy() {
  if (PAGE !== 'home') return;
  if (Date.now() < navLock) { navLock = Date.now() + 250; return; }
  let cur = '';
  NAV_LINKS.forEach(a => {
    const h = new URL(a.getAttribute('href'), location.href).hash;
    const sec = anchorTarget(h);
    if (!sec) return;
    const r = sec.getBoundingClientRect();
    if (r.top <= 140 && r.bottom > 140) cur = h;
  });
  navMark(cur);
}

if (PAGE === 'home') {
  addEventListener('scroll', () => { clearTimeout(navLockTimer); navLockTimer = setTimeout(navSpy, 60); }, { passive: true });
  addEventListener('load', navSpy);
  addEventListener('resize', navSpy);
  navSpy();
}


/* ==========================================================================
   6. Global click handling, forms
   ========================================================================== */
document.addEventListener('click', e => {
  const t = e.target;
  let el;

  // placeholder links (href="#") must not jump to the top of the page
  if (t.closest('a[href="#"]')) { e.preventDefault(); return; }

  // links inside the cart drawer should close it (needed for same-page anchors)
  if (t.closest('#cart a[href]')) openCart(false);

  // same-page anchors (Technology / Find yours / Compare ...): scroll reliably, see section 6b
  if ((el = t.closest('a[href*="#"]')) && !e.defaultPrevented && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
    const u = new URL(el.getAttribute('href'), location.href);
    if (u.hash.length > 1 && u.pathname === location.pathname && anchorTarget(u.hash)) {
      e.preventDefault();
      toggleMenu(false);
      openCart(false);
      history.pushState(null, '', u.hash);
      goToAnchor(u.hash);
      navMark(u.hash, true);
      return;
    }
  }

  if ((el = t.closest('[data-add]'))) { e.preventDefault(); addCart(el.dataset.add, 1); return; }

  if ((el = t.closest('[data-q]'))) {
    const item = CART.find(x => x.id === el.dataset.q);
    if (item) {
      item.qty += +el.dataset.d;
      if (item.qty <= 0) CART = CART.filter(x => x !== item);
      saveCart();
      renderCart();
    }
    return;
  }

  if ((el = t.closest('[data-rm]'))) {
    CART = CART.filter(x => x.id !== el.dataset.rm);
    saveCart();
    renderCart();
    return;
  }

  if ((el = t.closest('[data-cf]'))) { CAT_FILTER = el.dataset.cf; renderCatalog(); return; }
  if ((el = t.closest('[data-bf]'))) { BLOG_FILTER = el.dataset.bf; renderBlog(); return; }

  if ((el = t.closest('.faq button'))) {
    const faq = el.parentElement;
    const open = !faq.classList.contains('open');
    faq.classList.toggle('open', open);
    el.setAttribute('aria-expanded', open);
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { openCart(false); toggleMenu(false); }
});

// newsletter (footer, every page)
$('#nlForm').addEventListener('submit', e => {
  e.preventDefault();
  const input = e.target.querySelector('input');
  const msg = $('#nlMsg');
  const ok = EMAIL_RE.test(input.value.trim());
  msg.textContent = ok ? 'Merci! Use code LUNEVO10 for 10% off your first order.' : 'Please enter a valid email address.';
  msg.style.color = ok ? 'var(--lime)' : '#ff9a8a';
  if (ok) input.value = '';
});


/* ==========================================================================
   7. 3D helper (the Three.js scene lives in js/robot3d.js)
   ========================================================================== */
function with3D(fn) {
  if (window.Robot3D) fn(window.Robot3D);
  else window.addEventListener('robot3d', () => fn(window.Robot3D), { once: true });
}

let currentProduct = null;


/* ==========================================================================
   8. Page renderers
   ========================================================================== */

/* ---------- Catalog ---------- */
let CAT_FILTER = 'all';
let CAT_SORT = 'rec';

function renderCatalog() {
  const filters = [['all', 'All robots'], ['pets', 'Pet-friendly'], ['station', 'Self-washing'], ['mop', 'With mop'], ['u600', 'Under $600']];
  $('#catFilters').innerHTML = filters.map(f =>
    `<button type="button" class="cchip ${CAT_FILTER === f[0] ? 'on' : ''}" data-cf="${f[0]}">${f[1]}</button>`).join('');

  const list = MODELS.filter(m =>
    CAT_FILTER === 'all' ||
    (CAT_FILTER === 'pets' && m.pets) ||
    (CAT_FILTER === 'station' && m.station >= 2) ||
    (CAT_FILTER === 'mop' && m.mop >= 1) ||
    (CAT_FILTER === 'u600' && m.price < 600));

  if (CAT_SORT === 'pa') list.sort((a, b) => a.price - b.price);
  if (CAT_SORT === 'pd') list.sort((a, b) => b.price - a.price);
  if (CAT_SORT === 'suc') list.sort((a, b) => b.pa - a.pa);

  let html = list.map((m, i) => `<div class="rv" style="--d:${i * .06}s">${cardHTML(m)}</div>`).join('')
    || '<p class="mut">No robots match this filter.</p>';

  // fill the empty cell of the 3-column grid with a promo tile
  if (list.length % 3 === 2) {
    html += `<a href="index.html#finder" class="bt bt-dark spot promo rv" style="--d:.3s">
      <div class="ib tile--lime">${ic('sliders')}</div>
      <div><span class="eyebrow eyebrow--lime">Not sure?</span><h3 class="h2" style="font-size:1.8rem;margin:.6rem 0">Let the finder choose</h3><p>Answer 8 quick questions and get your exact match, price and instalments.</p></div>
      <span class="btn btn-lime btn-sm" style="align-self:flex-start">Open the finder <span class="ico">${ic('arrow')}</span></span>
    </a>`;
  }
  $('#catGrid').innerHTML = html;

  const acc = $('#accGrid');
  if (!acc.children.length) acc.innerHTML = ACC.map(accHTML).join('');
  observeReveals();
}

/* ---------- Product ---------- */
function renderProduct(id) {
  const m = MODELS.find(x => x.id === id);
  if (!m) { location.replace('catalog.html'); return null; }

  const related = MODELS.filter(x => x.id !== id)
    .sort((a, b) => Math.abs(a.tier - m.tier) - Math.abs(b.tier - m.tier))
    .slice(0, 3);

  const rows = [
    ['Suction power', m.pa.toLocaleString() + ' Pa'],
    ['Navigation', m.nav],
    ['Obstacle recognition', m.obst],
    ['Battery', m.bat.toLocaleString() + ' mAh · ' + m.runtime + ' min'],
    ['Coverage per charge', m.cover + ' m²'],
    ['Noise (quiet mode)', m.noise + ' dB'],
    ['Mopping', m.mopLabel],
    ['Station', m.stationLabel],
    ['Brush system', m.brush],
    ['Threshold climb', m.climb + ' mm'],
    ['Air filtration', m.hepa],
    ['Connectivity', 'Wi-Fi 6 · Matter · Alexa · Google · Apple Home'],
    ['Warranty', '3 years (extendable to 5)']
  ];
  const mopName = m.mop ? ['', 'Vibrating pad', 'Spinning pads', 'Hot-water roller'][m.mop] : 'Vacuum only';
  const stationName = m.station >= 2 ? 'Self-washing' : m.station === 1 ? 'Auto-empty' : 'Simple dock';

  $('#productView').innerHTML = `
    <div class="phero" style="padding-bottom:0">
      <div class="crumb"><a href="index.html">Home</a>${ic('chev-r')}<a href="catalog.html">Robots</a>${ic('chev-r')}<span style="color:var(--ink)">${m.name}</span></div>
    </div>

    <div class="grid gap-8 lg:grid-cols-[1.05fr_.95fr] mt-6">
      <div>
        <div class="viewer" id="viewer">
          <span class="tagp vtag">${m.tag}</span>
          ${m.gallery.map((id, i) => `<img class="vimg${i === 0 ? ' on' : ''}" data-i="${i}" src="${px(id, 1000, 1000)}" alt="${m.name} — photo ${i + 1}">`).join('')}
        </div>
        <div class="thumbs">
          ${m.gallery.map((id, i) => `<button type="button" class="thumb${i === 0 ? ' on' : ''}" data-i="${i}" aria-label="${m.name} — photo ${i + 1}"><img src="${px(id, 400, 250)}" alt="" loading="lazy"></button>`).join('')}
        </div>
      </div>

      <div>
        <div class="flex flex-wrap items-center gap-3"><span class="tagp">${m.tag}</span><span class="flex items-center gap-2 text-sm font-bold"><span class="pulse-dot" style="background:#3bb273"></span>In stock · ships today</span></div>
        <h1 class="h2" style="font-size:clamp(2.2rem,4.6vw,3.6rem);margin-top:1rem">Lunevo <span class="grad">${m.name}</span></h1>
        <div class="flex items-center gap-3 mt-3 text-sm"><span class="stars">${ic('star').repeat(5)}</span><b>4.${6 + m.tier % 3}</b><span class="mut">· ${(m.tier * 1180 + 240).toLocaleString()} reviews</span></div>
        <p class="lead mt-4">${m.short}</p>
        <div class="flex flex-wrap items-end gap-x-4 gap-y-1 mt-6">
          <span class="display" style="font-size:2.8rem;font-weight:800;letter-spacing:-.05em;line-height:1">${fmt(m.price)}</span>
          ${m.old ? `<s class="mut font-bold">${fmt(m.old)}</s><span class="tagp" style="background:var(--lime);color:var(--ink)">Save ${fmt(m.old - m.price)}</span>` : ''}
        </div>
        <p class="text-sm mut mt-2">VAT included · or <b style="color:var(--ink)">3 × ${fmt(m.price / 3)}</b> at 0% interest</p>

        <div class="grid grid-cols-2 gap-2 mt-6">
          <div class="chipk">${ic('wind')}<span>${m.pa.toLocaleString()} Pa<small>Suction</small></span></div>
          <div class="chipk">${ic('cube')}<span>${m.nav.split(' + ')[0]}<small>Navigation</small></span></div>
          <div class="chipk">${ic('battery')}<span>${m.runtime} min<small>Runtime</small></span></div>
          <div class="chipk">${ic('volume')}<span>${m.noise} dB<small>Quiet mode</small></span></div>
          <div class="chipk">${ic('drop')}<span>${mopName}<small>Mopping</small></span></div>
          <div class="chipk">${ic('home')}<span>${stationName}<small>Station</small></span></div>
        </div>

        ${m.tier >= 4 ? `<div class="mt-5 flex items-center gap-3 text-sm font-bold" style="background:rgba(200,243,60,.35);padding:.8rem 1rem;border-radius:18px">${ic('award')}<span>Free $39 spare kit included with this robot</span></div>` : ''}

        <div class="flex flex-wrap items-center gap-3 mt-6">
          <div class="qty" style="padding:2px"><button type="button" id="pqm" aria-label="Decrease">${ic('minus')}</button><span id="pq">1</span><button type="button" id="pqp" aria-label="Increase">${ic('plus')}</button></div>
          <button type="button" class="btn btn-lime" id="pAdd" style="flex:1;min-width:190px;justify-content:space-between">Add to cart <span class="ico">${ic('cart')}</span></button>
        </div>
        <button type="button" class="btn btn-ghost btn-block mt-3" id="pBuy">Buy now · free delivery <span class="ico">${ic('arrow')}</span></button>

        <div class="grid grid-cols-3 gap-2 mt-5 text-center text-xs font-bold">
          <div class="chipk chipk--col">${ic('truck')}<span>Free delivery<small>2–4 days</small></span></div>
          <div class="chipk chipk--col">${ic('return')}<span>30-day trial<small>Free returns</small></span></div>
          <div class="chipk chipk--col">${ic('shield')}<span>3-year cover<small>Included</small></span></div>
        </div>
      </div>
    </div>

    <section class="sec">
      <div class="grid gap-6 lg:grid-cols-2">
        <div class="dark spot rv" style="padding:var(--pad-block)">
          <span class="eyebrow eyebrow--lime">Why you’ll love it</span>
          <h2 class="h3" style="font-size:1.8rem;margin:.8rem 0 1.4rem">Highlights</h2>
          <ul style="list-style:none;padding:0;margin:0;display:grid;gap:1rem">${m.hl.map(h => `<li class="hl" style="color:rgba(255,255,255,.85)">${ic('check')}<span>${h}</span></li>`).join('')}</ul>
          <h3 class="h3 mt-8 mb-3" style="font-size:1.1rem">In the box</h3>
          <div class="flex flex-wrap gap-2">${m.box.map(b => `<span class="tagp" style="background:rgba(255,255,255,.1);color:#fff;text-transform:none;letter-spacing:0;font-size:.76rem">${b}</span>`).join('')}</div>
        </div>
        <div class="card rv" style="padding:var(--pad-block);--d:.08s">
          <span class="eyebrow">Specifications</span>
          <h2 class="h3" style="font-size:1.8rem;margin:.8rem 0">Full tech sheet</h2>
          ${rows.map(r => `<div class="spec-row"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}
        </div>
      </div>
    </section>

    <section class="sec">
      <div class="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div><span class="eyebrow rv">Also consider</span><h2 class="h2 rv" style="font-size:clamp(1.8rem,3.4vw,2.8rem)">Compare with <span class="grad">similar robots</span></h2></div>
        <a class="btn btn-ghost btn-sm rv" href="index.html#compare">Full comparison <span class="ico">${ic('arrow')}</span></a>
      </div>
      <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">${related.map((r, i) => `<div class="rv" style="--d:${i * .07}s">${cardHTML(r)}</div>`).join('')}</div>
    </section>`;

  // quantity + buy buttons
  let qty = 1;
  const qtyEl = $('#pq');
  $('#pqm').addEventListener('click', () => { qty = Math.max(1, qty - 1); qtyEl.textContent = qty; });
  $('#pqp').addEventListener('click', () => { qty = Math.min(9, qty + 1); qtyEl.textContent = qty; });
  $('#pAdd').addEventListener('click', () => addCart(m.id, qty));
  $('#pBuy').addEventListener('click', () => addCart(m.id, qty));

  // photo gallery switch
  $$('.thumb').forEach(btn => btn.addEventListener('click', () => {
    $$('.thumb').forEach(x => x.classList.toggle('on', x === btn));
    $$('.vimg').forEach(x => x.classList.toggle('on', x.dataset.i === btn.dataset.i));
  }));

  document.title = `Lunevo ${m.name} — ${m.tag} robot vacuum | LUNEVO`;
  return m;
}

/* ---------- Blog list ---------- */
let BLOG_FILTER = 'All';

function renderBlog() {
  const cats = ['All', ...new Set(POSTS.map(p => p.cat))];
  $('#blogFilters').innerHTML = cats.map(c =>
    `<button type="button" class="cchip ${BLOG_FILTER === c ? 'on' : ''}" data-bf="${c}">${c}</button>`).join('');

  const featured = POSTS[0];
  const list = POSTS.filter(p => BLOG_FILTER === 'All' ? p !== featured : p.cat === BLOG_FILTER);

  $('#blogFeat').innerHTML = BLOG_FILTER === 'All' ? `
    <a href="article.html?id=${featured.id}" class="dark spot rv blog-feat">
      <div class="pic"><img src="${px(featured.img, 1200, 800)}" alt="${featured.title}" loading="lazy"></div>
      <div class="txt">
        <span class="tagp" style="align-self:flex-start">Featured · ${featured.cat}</span>
        <h2 class="h2" style="font-size:clamp(1.6rem,3vw,2.5rem);margin:0">${featured.title}</h2>
        <p class="on-dark" style="margin:0">${featured.ex}</p>
        <span class="flex items-center gap-2 font-bold" style="color:var(--lime)">Read article ${ic('arrow')}</span>
      </div>
    </a>` : '';

  $('#blogGrid').innerHTML = list.map((p, i) => postCard(p, (i % 3) * .07)).join('');
  observeReveals();
}

/* ---------- Article ---------- */
function renderArticle(id) {
  const p = POSTS.find(x => x.id === id);
  if (!p) { location.replace('blog.html'); return null; }

  const body = p.body.map(b =>
    b.startsWith('## ') ? `<h3>${b.slice(3)}</h3>`
    : b.startsWith('> ') ? `<blockquote>${b.slice(2)}</blockquote>`
    : `<p>${b}</p>`).join('');
  const more = POSTS.filter(x => x.id !== id).slice(0, 3);

  $('#articleView').innerHTML = `
    <div class="phero" style="padding-bottom:0">
      <div class="crumb"><a href="index.html">Home</a>${ic('chev-r')}<a href="blog.html">Journal</a>${ic('chev-r')}<span style="color:var(--ink)">${p.cat}</span></div>
    </div>

    <article style="max-width:860px;margin:1.6rem auto 0">
      <span class="tagp rv">${p.cat}</span>
      <h1 class="h2 rv" style="font-size:clamp(2rem,5vw,3.6rem);margin-top:1rem;--d:.05s">${p.title}</h1>
      <div class="flex flex-wrap items-center gap-4 mt-5 text-sm font-bold rv" style="--d:.1s">
        <span class="flex items-center gap-2"><i style="width:2.4rem;height:2.4rem;border-radius:50%;background:var(--violet);color:#fff;display:grid;place-items:center;font-style:normal;font-size:.75rem">EM</i>Lunevo Editorial</span>
        <span class="mut">${p.date}</span><span class="mut">· ${p.read} read</span>
      </div>
    </article>

    <div class="mi rv" style="max-width:1100px;margin:2rem auto;aspect-ratio:16/8;min-height:240px;border-radius:32px"><img src="${px(p.img, 1400, 700)}" alt="${p.title}"></div>
    <div class="prose rv" style="max-width:760px;margin:0 auto">${body}</div>

    <div class="dark spot rv" style="max-width:760px;margin:2.4rem auto 0;padding:var(--pad-block);display:flex;flex-wrap:wrap;gap:1.2rem;align-items:center;justify-content:space-between">
      <div><b class="display" style="font-size:1.3rem">Not sure which robot fits?</b><p class="on-dark" style="margin:.3rem 0 0;font-size:.9rem">Answer 8 questions, get your exact match.</p></div>
      <a href="index.html#finder" class="btn btn-lime btn-sm">Try the finder <span class="ico">${ic('arrow')}</span></a>
    </div>

    <section class="sec">
      <div class="flex items-end justify-between gap-4 mb-8"><h2 class="h2" style="font-size:clamp(1.7rem,3vw,2.4rem)">Keep reading</h2><a href="blog.html" class="btn btn-ghost btn-sm">All articles <span class="ico">${ic('arrow')}</span></a></div>
      <div class="grid gap-5 md:grid-cols-3">${more.map((r, i) => postCard(r, i * .07)).join('')}</div>
    </section>`;

  document.title = p.title + ' | LUNEVO Journal';
  return p;
}

/* ---------- Contact form ---------- */
function initContact() {
  const form = $('#contactForm');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#cName'), mail = $('#cMail'), msg = $('#cMsg'), err = $('#cErr');
    [name, mail, msg].forEach(x => x.classList.remove('err'));
    let problem = '';
    if (name.value.trim().length < 2) { name.classList.add('err'); problem = 'Please enter your name.'; }
    else if (!EMAIL_RE.test(mail.value.trim())) { mail.classList.add('err'); problem = 'Please enter a valid email address.'; }
    else if (msg.value.trim().length < 10) { msg.classList.add('err'); problem = 'Your message is a little short — tell us a bit more.'; }
    err.textContent = problem;
    if (problem) return;
    // TODO: send the form to your backend / form service here
    form.style.display = 'none';
    $('#contactOk').style.display = 'block';
  });
  $('#contactAgain').addEventListener('click', () => {
    form.reset();
    form.style.display = 'block';
    $('#contactOk').style.display = 'none';
  });
}


/* ==========================================================================
   9. Init
   ========================================================================== */
renderCart();
onScroll();

switch (PAGE) {
  case 'catalog':
    $('#catSort').addEventListener('change', e => { CAT_SORT = e.target.value; renderCatalog(); });
    renderCatalog();
    break;

  case 'product': {
    const id = new URLSearchParams(location.search).get('id');
    currentProduct = renderProduct(id);
    break;
  }

  case 'blog':
    renderBlog();
    break;

  case 'article':
    renderArticle(new URLSearchParams(location.search).get('id'));
    break;

  case 'support':
    renderFaq($('#supportFaq'));
    break;

  case 'contact':
    initContact();
    break;
}

// counters (home page) and reveal animations
$$('[data-count]').forEach(el => counterObserver && counterObserver.observe(el));
observeReveals();
