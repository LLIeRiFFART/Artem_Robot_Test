/**
 * home.js — scripts used only on index.html
 *
 *  1. Static fills (illustrations, line-up rail, blog preview, FAQ, ticker)
 *  2. Scroll-driven 3D anatomy
 *  3. Smart map animation
 *  4. Video showcase + film modal
 *  5. Robot finder (calculator)
 *  6. Comparison table
 *  7. Live dashboard widget
 *  8. Scroll handler & 3D mounting
 *
 * Requires main.js (helpers, templates, cart) and data.js.
 */
'use strict';

/* ==========================================================================
   1. Static fills
   ========================================================================== */
$('#heroFb').innerHTML = robotSVG(MODELS[4]);
$('#anaFb').innerHTML = robotSVG(MODELS[4]);
$('#lineupRail').innerHTML = MODELS.map(cardHTML).join('');
$('#homeBlog').innerHTML = POSTS.slice(0, 3).map((p, i) => postCard(p, i * .08)).join('');
renderFaq($('#homeFaq'));

// duplicate the ticker content so the loop is seamless
$('#tickerIn').innerHTML += $('#tickerIn').innerHTML;

$('#railPrev').addEventListener('click', () => $('#lineupRail').scrollBy({ left: -320, behavior: 'smooth' }));
$('#railNext').addEventListener('click', () => $('#lineupRail').scrollBy({ left: 320, behavior: 'smooth' }));


/* ==========================================================================
   2. Scroll-driven 3D anatomy
   ========================================================================== */
let heroInst = null;
let anaInst = null;
const anaSection = $('#tech');
const anaSteps = $$('.ana-step');
const anaDots = $$('#anaRail i');
let anaStage = -1;

function anaUpdate() {
  const rect = anaSection.getBoundingClientRect();
  const total = anaSection.offsetHeight - innerHeight;
  if (total <= 0) return;
  const p = clamp(-rect.top / total, 0, 1);
  const stage = Math.min(6, Math.floor(p * 7));
  if (stage !== anaStage) {
    anaStage = stage;
    anaSteps.forEach((s, i) => s.classList.toggle('on', i === stage));
    anaDots.forEach((d, i) => d.classList.toggle('on', i === stage));
    $('#anaCount').textContent = '0' + (stage + 1) + ' / 07';
  }
  $('#anaBar').style.width = (p * 100) + '%';
  if (anaInst) anaInst.setProgress(p, stage);
}


/* ==========================================================================
   3. Smart map animation
   ========================================================================== */
const MAP_PATH_D = 'M52 230H330V255H52V280H330V305H52V330H330V355H52V380H560V350H385V320H560V290H385V260H560V230H385V160H560V125H385V90H560V55H40V90H335V125H40V160H335';
const mapPath = $('#mapPathBase');
['#mapPathBase', '#mapTrail', '#mapTrailWide'].forEach(sel => $(sel).setAttribute('d', MAP_PATH_D));

const mapLength = mapPath.getTotalLength();
const mapTrail = $('#mapTrail');
const mapTrailWide = $('#mapTrailWide');
const mapBot = $('#mapBot');
const mapDirt = [];
const MAP_ROOM_MARKS = [.38, .61, .77, .99];

[mapTrail, mapTrailWide].forEach(t => {
  t.style.strokeDasharray = mapLength;
  t.style.strokeDashoffset = mapLength;
});

// scatter "dust" along the route (seeded, so it is always the same)
(function scatterDust() {
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const group = $('#mapDirt');
  for (let i = 0; i < 46; i++) {
    const at = .02 + rnd() * .96;
    const pt = mapPath.getPointAtLength(at * mapLength);
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', pt.x + (rnd() - .5) * 8);
    dot.setAttribute('cy', pt.y + (rnd() - .5) * 8);
    dot.setAttribute('r', 1.4 + rnd() * 1.6);
    dot.setAttribute('fill', 'rgba(255,255,255,.5)');
    dot.style.transition = 'opacity .4s,transform .4s';
    group.appendChild(dot);
    mapDirt.push([at, dot]);
  }
})();

function mapUpdate() {
  const rect = $('#nav-map').getBoundingClientRect();
  const vh = innerHeight;
  const p = clamp((vh * .8 - rect.top) / (rect.height + vh * .2), 0, 1);
  const pt = mapPath.getPointAtLength(p * mapLength);

  mapTrail.style.strokeDashoffset = mapTrailWide.style.strokeDashoffset = mapLength * (1 - p);
  mapBot.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
  mapDirt.forEach(([at, dot]) => {
    const cleaned = p > at;
    dot.style.opacity = cleaned ? 0 : 1;
    dot.style.transform = cleaned ? 'scale(0)' : 'none';
  });

  $('#mapPct').textContent = Math.round(p * 100) + '%';
  $('#mapRooms').textContent = MAP_ROOM_MARKS.filter(t => p >= t).length + '/4';
  $('#mapArea').textContent = Math.round(p * 112);
  $('#mapTime').textContent = Math.round(p * 78);
}


/* ==========================================================================
   4. Video showcase + film modal
   ========================================================================== */
const clipEls = $$('#vshow video');
let clipIndex = 0;
let showcaseVisible = false;

function addSources(video, urls) {
  if (video.dataset.loaded) return;
  video.dataset.loaded = '1';
  urls.forEach(url => {
    const source = document.createElement('source');
    source.src = url;
    source.type = 'video/mp4';
    video.appendChild(source);
  });
  // preload="none" in the HTML would delay the download until play(); ask for the data right away
  video.preload = 'auto';
  video.load();
}

function setClip(i) {
  clipIndex = i;
  clipEls.forEach((v, j) => {
    v.classList.toggle('on', j === i);
    if (j !== i) v.pause();
  });
  $$('.vtab').forEach((tab, j) => tab.classList.toggle('on', j === i));
  $('#vTitle').textContent = CLIPS[i].title;
  $('#vDesc').textContent = CLIPS[i].text;
  addSources(clipEls[i], CLIPS[i].sources);
  if (showcaseVisible) clipEls[i].play().catch(() => {});
}

// 1) the first clip starts downloading as soon as the page has loaded,
// 2) the clip that is currently selected is (re)requested ~2 screens before the section appears,
// so the video is already buffered when the visitor scrolls to it for the first time.
addEventListener('load', () => addSources(clipEls[0], CLIPS[0].sources));
if ('IntersectionObserver' in window) {
  const preloader = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    addSources(clipEls[clipIndex], CLIPS[clipIndex].sources);
    preloader.disconnect();
  }, { rootMargin: '2000px 0px' });
  preloader.observe($('#vshow'));
}

// play only while the showcase is on screen
if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
    showcaseVisible = entries[0].isIntersecting;
    if (showcaseVisible) setClip(clipIndex);
    else clipEls.forEach(v => v.pause());
  }, { threshold: .25 }).observe($('#vshow'));
}

const filmModal = $('#vmodal');
const filmVideo = $('#vmodalVideo');

function openFilm(open) {
  filmModal.classList.toggle('open', open);
  filmModal.setAttribute('aria-hidden', !open);
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) {
    if (!filmVideo.dataset.loaded) {
      FILM.forEach(url => {
        const source = document.createElement('source');
        source.src = url;
        source.type = 'video/mp4';
        filmVideo.appendChild(source);
      });
      filmVideo.dataset.loaded = '1';
      filmVideo.load();
    }
    filmVideo.play().catch(() => {});
  } else {
    filmVideo.pause();
  }
}

document.addEventListener('click', e => {
  let el;
  if ((el = e.target.closest('[data-vt]'))) setClip(+el.dataset.vt);
  else if (e.target.closest('[data-video]')) openFilm(true);
});
$('#vclose').addEventListener('click', () => openFilm(false));
filmModal.addEventListener('click', e => { if (e.target === filmModal) openFilm(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') openFilm(false); });


/* ==========================================================================
   5. Robot finder (calculator)
   ========================================================================== */
const F = {
  levels: 1, floor: 'hard', pets: 'none', people: 2, allergy: 0,
  mop: 0, hands: 0, area: 85, budget: 1000,
  pay: 1, trade: false, pick: null, acc: new Set()
};

// 1) how powerful a robot does this home need? (tier 1–5)
function needTier() {
  let pts = 0;
  const a = F.area;
  pts += a < 50 ? 0 : a < 90 ? 1 : a < 140 ? 2 : a < 220 ? 3 : 4;
  pts += F.levels === 2 ? 1 : F.levels === 3 ? 2 : 0;
  pts += F.floor === 'mixed' ? 1 : F.floor === 'carpet' ? 2 : 0;
  pts += F.pets === 'short' ? 1 : F.pets === 'long' ? 2 : 0;
  pts += F.people >= 5 ? 1 : 0;
  pts += F.allergy ? 1 : 0;
  pts += F.hands;

  let t = pts <= 1 ? 1 : pts <= 3 ? 2 : pts <= 5 ? 3 : pts <= 7 ? 4 : 5;
  if (F.mop) t = Math.max(t, 2);
  if (F.pets === 'long') t = Math.max(t, 3);
  if (F.allergy) t = Math.max(t, 2);
  if (F.hands === 1) t = Math.max(t, 2);
  if (F.hands === 2) t = Math.max(t, 4);
  if (F.floor === 'carpet' && F.mop) t = Math.max(t, 4);
  while (t < 5 && F.area > MODELS[t - 1].maxArea) t++;
  return clamp(t, 1, 5);
}

// 2) what would the chosen model be missing?
function misses(m) {
  const list = [];
  if (F.mop && !m.mop) list.push('it can’t mop');
  if (F.pets === 'long' && !m.tangle) list.push('its brush isn’t tangle-free');
  if (F.hands === 2 && m.station < 2) list.push('it has no self-washing station');
  else if (F.hands === 1 && m.station < 1) list.push('it has no auto-empty dock');
  if (F.allergy && m.hepaN < 2) list.push('it has basic filtration only');
  if (F.floor === 'carpet' && F.mop && m.mop < 2) list.push('its mop doesn’t lift on carpet');
  if (F.area > m.maxArea) list.push('it’s sized for smaller homes');
  return list;
}

function computeMatch() {
  const need = needTier();
  const ideal = MODELS[need - 1];
  let model = ideal;
  let overBudget = false;

  if (F.pick) {
    model = MODELS.find(x => x.id === F.pick);
  } else if (ideal.price > F.budget) {
    const affordable = MODELS.filter(x => x.price <= F.budget);
    model = affordable.length ? affordable[affordable.length - 1] : MODELS[0];
    overBudget = true;
  }

  const gaps = misses(model);
  const match = clamp(99 - Math.max(0, need - model.tier) * 7 - gaps.length * 4 - Math.max(0, model.tier - need) * 5, 52, 99);
  return { m: model, need, ideal, over: overBudget, v: gaps, match };
}

// keep the sticky result card inside the viewport
function fitResult() {
  const wrap = $('.fres');
  const card = $('#fres');
  if (!wrap || !card) return;
  wrap.style.top = Math.min(96, innerHeight - card.offsetHeight - 24) + 'px';
}

function renderFinder() {
  const r = computeMatch();
  const m = r.m;

  // inputs
  $('#fAreaV').textContent = F.area;
  $('#fBudgetV').textContent = F.budget.toLocaleString('en-US');
  [['#fArea', 20, 300], ['#fBudget', 300, 1500]].forEach(([sel, min, max]) => {
    const el = $(sel);
    el.style.setProperty('--p', ((el.value - min) / (max - min) * 100) + '%');
  });

  // header of the result card
  $('#rMatch').textContent = r.match + '% match';
  $('#rSvg').innerHTML = robotSVG(m);
  $('#rTag').textContent = m.tag + (F.pick ? ' · your pick' : '');
  $('#rName').textContent = 'Lunevo ' + m.name;
  $('#rPrice').textContent = fmt(m.price);

  // warnings
  const note = $('#rNote');
  let message = '';
  if (r.over) {
    message = `Your ideal match is Lunevo ${r.ideal.name} (${fmt(r.ideal.price)}), above your ${fmt(F.budget)} budget. This is the best fit within budget${r.v.length ? ' — note: ' + r.v.join(', ') + '.' : '.'}`;
  } else if (F.pick && r.v.length) {
    message = `Heads up: ${r.v.join(', ')}.`;
  } else if (F.pick && m.price > F.budget) {
    message = `This pick is ${fmt(m.price - F.budget)} above your budget.`;
  }
  note.textContent = message;
  note.style.display = message ? 'block' : 'none';

  // reasons
  const mins = Math.round(F.area * m.runtime / m.cover);
  const duration = mins >= 90 ? `${Math.floor(mins / 60)} h ${mins % 60} min` : `${mins} min`;
  const reasons = [];
  reasons.push(`<b>${F.area} m²</b> over ${F.levels >= 3 ? '3+ floors' : F.levels + ' floor' + (F.levels > 1 ? 's' : '')}: a full clean takes about <b>${duration}</b>${F.area > m.cover ? ' (it recharges and resumes)' : ''}.`);
  reasons.push(
    F.floor === 'hard' ? 'Soft rolling brush is gentle on parquet and tile.'
    : F.floor === 'mixed' ? `Auto carpet detection boosts suction to <b>${m.pa.toLocaleString()} Pa</b> on rugs.`
    : `<b>${m.pa.toLocaleString()} Pa</b> pulls dirt from deep fibres${m.mop >= 2 ? '; mop pads lift clear of carpet' : ''}.`);
  if (F.pets !== 'none') {
    reasons.push(m.tangle
      ? `<b>Zero-Tangle™</b> brush handles ${F.pets === 'long' ? 'long hair and shedding' : 'pet hair'} with no untangling.`
      : `Handles ${F.pets} pet hair; clean the brush weekly.`);
  }
  if (F.mop) reasons.push(`Mopping: <b>${m.mopLabel}</b>.`);
  reasons.push(`Station: <b>${m.stationLabel}</b>.`);
  if (F.allergy) reasons.push(`Air filtration: <b>${m.hepa}</b>.`);
  $('#rReasons').innerHTML = reasons.slice(0, 6).map(x => `<li>${ic('check')}<span>${x}</span></li>`).join('');

  $('#rStats').innerHTML = [[m.pa.toLocaleString(), 'Pa suction'], [m.runtime, 'min runtime'], [m.noise, 'dB quiet']]
    .map(s => `<div class="mini f-stat"><b>${s[0]}</b><span>${s[1]}</span></div>`).join('');

  // add-ons (the spare kit is free with Orbit Pro / Atlas Ultra)
  const kitIncluded = m.tier >= 4;
  if (kitIncluded) F.acc.delete('acc-kit');
  $('#rAddons').innerHTML = CALC_ACC.map(id => {
    const a = ACC.find(x => x.id === id);
    if (id === 'acc-kit' && kitIncluded) {
      return `<div class="ck ck--static"><span class="bx">${ic('check')}</span><span>${a.name}</span><em>Included</em></div>`;
    }
    return `<label class="ck"><input type="checkbox" data-acc="${id}" ${F.acc.has(id) ? 'checked' : ''}><span class="bx">${ic('check')}</span><span>${a.name}</span><em>+${fmt(a.price)}</em></label>`;
  }).join('');

  // price breakdown
  const selected = CALC_ACC.filter(id => F.acc.has(id));
  const accSum = selected.reduce((sum, id) => sum + ACC.find(a => a.id === id).price, 0);
  const saving = accSum * .1;
  const trade = F.trade ? 50 : 0;
  const total = m.price + accSum - saving - trade;

  let lines = `<div class="ln"><span>Lunevo ${m.name}</span><b>${fmt(m.price)}</b></div>`;
  if (accSum) {
    lines += `<div class="ln"><span>Add-ons (${selected.length})</span><b>${fmt(accSum)}</b></div>
              <div class="ln"><span>Bundle saving −10%</span><b class="good">−${fmt(saving)}</b></div>`;
  }
  if (trade) lines += `<div class="ln"><span>Trade-in credit</span><b class="good">−${fmt(trade)}</b></div>`;
  if (kitIncluded) lines += `<div class="ln"><span>Spare kit ($39)</span><b class="good">Free</b></div>`;
  lines += `<div class="ln"><span>Delivery in France &amp; EU</span><b>Free</b></div>
            <div class="ln"><span>of which VAT (20%)</span><b>${fmt(total - total / 1.2)}</b></div>`;
  $('#rLines').innerHTML = lines;
  $('#rTotal').textContent = fmt(total);

  $('#rMonthly').innerHTML =
    F.pay === 3 ? `3 × ${fmt(total / 3)}<br><span style="opacity:.7;font-weight:600">0% interest</span>`
    : F.pay === 12 ? `12 × ${fmt(total * 1.049 / 12)}<br><span style="opacity:.7;font-weight:600">4.9% APR</span>`
    : `or 3 × ${fmt(total / 3)}<br><span style="opacity:.7;font-weight:600">at 0% interest</span>`;

  $('#rView').setAttribute('href', 'product.html?id=' + m.id);

  // cheaper / better alternatives
  const cheaper = MODELS[m.tier - 2];
  const better = MODELS[m.tier];
  const altButton = (a, label, diff) => `<button type="button" class="alt" data-pick="${a.id}">
      <span style="width:48px;height:48px;flex:none">${robotSVG(a)}</span>
      <span class="min-w-0" style="flex:1"><b class="display text-sm" style="display:block">${label} · Lunevo ${a.name}</b><span class="text-xs" style="color:rgba(255,255,255,.6)">${a.tag} · ${a.pa.toLocaleString()} Pa · ${fmt(a.price)}</span></span>
      <b class="text-sm" style="color:var(--lime);white-space:nowrap">${diff}</b></button>`;
  $('#rAlt').innerHTML = `<div class="f-label">Other options</div><div class="grid gap-2">
      ${cheaper ? altButton(cheaper, 'Save', `−${fmt(m.price - cheaper.price)}`) : ''}
      ${better ? altButton(better, 'Step up', `+${fmt(better.price - m.price)}`) : ''}
      ${F.pick ? '<button type="button" class="alt" data-pick="" style="justify-content:center"><b class="text-sm">↺ Back to my best match</b></button>' : ''}
    </div>`;

  F.current = { m, selected };
  fitResult();
}

// option groups (floors, pets, ...)
$$('#fForm .opts').forEach(group => group.addEventListener('click', e => {
  const btn = e.target.closest('.opt');
  if (!btn) return;
  $$('.opt', group).forEach(x => x.classList.toggle('on', x === btn));
  const v = btn.dataset.v;
  F[group.dataset.k] = isNaN(+v) ? v : +v;
  F.pick = null;
  if (group.dataset.k === 'allergy' && +v === 1) F.acc.add('acc-hepa');
  renderFinder();
}));

$('#fArea').addEventListener('input', e => { F.area = +e.target.value; F.pick = null; renderFinder(); });
$('#fBudget').addEventListener('input', e => { F.budget = +e.target.value; F.pick = null; renderFinder(); });
$$('[data-preset]').forEach(btn => btn.addEventListener('click', () => {
  F.area = +btn.dataset.preset;
  $('#fArea').value = F.area;
  F.pick = null;
  renderFinder();
}));

$('#rAddons').addEventListener('change', e => {
  const id = e.target.dataset.acc;
  if (!id) return;
  if (e.target.checked) F.acc.add(id); else F.acc.delete(id);
  renderFinder();
});
$('#rPay').addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  F.pay = +btn.dataset.pay;
  $$('#rPay button').forEach(x => x.classList.toggle('on', x === btn));
  renderFinder();
});
$('#rTrade').addEventListener('change', e => { F.trade = e.target.checked; renderFinder(); });
$('#rAlt').addEventListener('click', e => {
  const btn = e.target.closest('[data-pick]');
  if (!btn) return;
  F.pick = btn.dataset.pick || null;
  renderFinder();
});
$('#rAdd').addEventListener('click', () => {
  const c = F.current;
  addCart(c.m.id, 1, { silent: true });
  c.selected.forEach(id => addCart(id, 1, { silent: true }));
  toast(`Lunevo ${c.m.name} bundle added${F.trade ? ' — trade-in applied at checkout' : ''}`);
  openCart(true);
});
addEventListener('resize', fitResult);
renderFinder();


/* ==========================================================================
   6. Comparison table
   ========================================================================== */
let compareIds = ['lume-5', 'orbit-pro', 'atlas-ultra'];

// [label, display fn, numeric value fn (optional), 'max' | 'min' = which is better]
const COMPARE_ROWS = [
  ['Price', m => fmt(m.price), m => m.price, 'min'],
  ['Suction power', m => m.pa.toLocaleString() + ' Pa', m => m.pa, 'max'],
  ['Navigation', m => m.nav, m => m.navLevel, 'max'],
  ['Obstacle recognition', m => m.obst],
  ['Runtime', m => m.runtime + ' min', m => m.runtime, 'max'],
  ['Coverage per charge', m => m.cover + ' m²', m => m.cover, 'max'],
  ['Noise (quiet mode)', m => m.noise + ' dB', m => m.noise, 'min'],
  ['Mopping', m => m.mopLabel, m => m.mop, 'max'],
  ['Station', m => m.stationLabel, m => m.station, 'max'],
  ['Brush', m => m.brush, m => m.tangle ? 1 : 0, 'max'],
  ['Threshold climb', m => m.climb + ' mm', m => m.climb, 'max'],
  ['Air filtration', m => m.hepa, m => m.hepaN, 'max'],
  ['Pet-ready (PetSense)', m => m.pets ? 'Yes' : 'No', m => m.pets ? 1 : 0, 'max'],
  ['Warranty', () => '3 years']
];

function renderCompare() {
  $('#cmpChips').innerHTML = MODELS.map(m =>
    `<button type="button" class="cchip ${compareIds.includes(m.id) ? 'on' : ''}" data-cmp="${m.id}">${m.name}</button>`).join('');

  const cols = compareIds.map(id => MODELS.find(m => m.id === id)).sort((a, b) => a.tier - b.tier);

  let html = `<thead><tr><th style="width:22%"></th>${cols.map(m => `<th>
      <div class="cmp-pic">${robotSVG(m)}</div>
      <div class="text-xs mut font-bold">${m.tag}</div>
      <div class="display" style="font-size:1.15rem;font-weight:800;letter-spacing:-.03em">${m.name}</div>
      <div class="display" style="font-size:1.3rem;font-weight:800;margin:.2rem 0 .6rem">${fmt(m.price)}</div>
      <div class="flex gap-2 flex-wrap">
        <a class="btn btn-dark btn-sm" href="product.html?id=${m.id}">View <span class="ico">${ic('arrow')}</span></a>
        <button type="button" class="icon-btn" style="width:2.7rem;height:2.7rem" data-add="${m.id}" aria-label="Add ${m.name}">${ic('cart')}</button>
      </div></th>`).join('')}</tr></thead><tbody>`;

  COMPARE_ROWS.forEach(row => {
    const nums = row[2] ? cols.map(m => row[2](m)) : null;
    let best = null;
    if (nums && row[3]) {
      const b = row[3] === 'max' ? Math.max(...nums) : Math.min(...nums);
      if (nums.some(n => n !== b)) best = b;   // highlight only if values differ
    }
    html += `<tr><th>${row[0]}</th>${cols.map((m, i) =>
      `<td class="${best !== null && nums[i] === best ? 'best' : ''}">${row[1](m)}</td>`).join('')}</tr>`;
  });

  $('#cmpTable').innerHTML = html + '</tbody>';
}

$('#cmpChips').addEventListener('click', e => {
  const btn = e.target.closest('[data-cmp]');
  if (!btn) return;
  const id = btn.dataset.cmp;
  if (compareIds.includes(id)) {
    if (compareIds.length <= 2) { toast('Keep at least two models to compare'); return; }
    compareIds = compareIds.filter(x => x !== id);
  } else {
    if (compareIds.length >= 3) { compareIds.shift(); toast('Comparing up to 3 models at once'); }
    compareIds.push(id);
  }
  renderCompare();
});
renderCompare();


/* ==========================================================================
   7. Live dashboard widget (hero strip)
   ========================================================================== */
(function liveDashboard() {
  const rooms = ['kitchen', 'living room', 'hallway', 'bedroom', 'office'];
  let k = 0, battery = 86, area = 63;
  setInterval(() => {
    if (document.hidden) return;
    k = (k + 1) % rooms.length;
    battery = battery <= 40 ? 90 : battery - 3;
    area = area >= 110 ? 20 : area + 7;
    $('#dashRoom').textContent = rooms[k];
    $('#dashBat').textContent = battery + '%';
    $('#dashArea').textContent = area;
    $('#dashBar').style.width = clamp(area / 112 * 100, 12, 100) + '%';
  }, 3200);
})();


/* ==========================================================================
   8. Scroll handler & 3D mounting
   ========================================================================== */
// floating chips in the hero move at different speeds
let parBase = 0;
function parMeasure() {
  const hv = $('#heroVisual');
  if (hv) parBase = Math.max(0, hv.getBoundingClientRect().top + scrollY - 140);
}
function parallax(y) {
  const hv = $('#heroVisual');
  const k = Math.min(1, (hv ? hv.offsetWidth : 560) / 560);   // smaller visual -> smaller drift, chips stay on the robot
  const v = clamp(y - parBase, 0, 500);
  $$('[data-par]').forEach(el => { el.style.marginTop = (-v * (+el.dataset.par) / 100 * k * k) + 'px'; });
}

let homeTicking = false;
function homeFrame() {
  anaUpdate();
  mapUpdate();
  parallax(scrollY);
}
addEventListener('scroll', () => {
  if (homeTicking) return;
  homeTicking = true;
  requestAnimationFrame(() => { homeTicking = false; homeFrame(); });
}, { passive: true });
addEventListener('resize', () => { parMeasure(); anaUpdate(); mapUpdate(); parallax(scrollY); });
addEventListener('load', () => { parMeasure(); parallax(scrollY); });
parMeasure();

// Three.js scenes are mounted as soon as js/robot3d.js is ready.
// If WebGL is not available the SVG fallbacks stay visible.
with3D(R => {
  heroInst = R.mount($('#heroCanvas'), { mode: 'hero', colors: MODELS[4].color });
  if (heroInst) $('#heroVisual').classList.add('has3d');

  anaInst = R.mount($('#anaCanvas'), { mode: 'anatomy', colors: MODELS[4].color });
  if (anaInst) {
    $('#anaCv').classList.add('has3d');
    anaUpdate();
  }
});

mapUpdate();
homeFrame();
observeReveals();
