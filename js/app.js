/* ───────────────────────────────────────────────────────────────────
   Sojourn Exchange — demo application
   Static SPA: hash router, JSON data, localStorage state.
   Listings: 50 real public listings (Sotheby's International Realty),
   USD $20M+, 20+ photographs each. Demo only — not affiliated.
   ─────────────────────────────────────────────────────────────────── */
(() => {
'use strict';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const app = $('#app');

/* ── accounts & state ────────────────────────────────────────────── */
const ACCT_KEY = 'sojourn.accounts.v1';
const SESSION_KEY = 'sojourn.session.v1';
function hashPw(pw){ let h = 0x811c9dc5; const t = 'sojourn·' + pw; for (let i=0;i<t.length;i++){ h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16).padStart(8,'0') + (t.length*7919 % 65521).toString(16); }
function accounts(){ try { return JSON.parse(localStorage.getItem(ACCT_KEY) || '{}'); } catch { return {}; } }
function saveAccounts(a){ localStorage.setItem(ACCT_KEY, JSON.stringify(a)); }
function seedAccounts(){
  const a = accounts();
  if (!a['phillip.dimitrov@gmail.com']) {
    a['phillip.dimitrov@gmail.com'] = { email:'phillip.dimitrov@gmail.com', name:'Phillip Dimitrov', pw: hashPw('test1234'), created:'2026-04-12', tier:'Founding Principal', entity:'Family office', seeded:true };
    saveAccounts(a);
  }
}
const initialsOf = n => n.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('') || 'S';
let currentUser = null; // email
function sessionEmail(){ return localStorage.getItem(SESSION_KEY) || null; }
function storeKey(){ return 'sojourn.state.v3.' + (currentUser || 'guest'); }
const defaultState = () => {
  const acct = accounts()[currentUser] || {};
  const seeded = !!acct.seeded;
  return {
    credits: seeded ? 7 : 0,
    creditsIssued: seeded ? 7 : 0,
    creditsHosted: 0,
    listings: seeded ? ['r12'] : [],
    hosted: [], stays: [], watchlist: seeded ? ['r46','r28'] : [], submissions: [], offers: [],
  };
};
let state = null;
function load(){ try { return Object.assign(defaultState(), JSON.parse(localStorage.getItem(storeKey()) || '{}')); } catch { return defaultState(); } }
function save(){ if (currentUser) localStorage.setItem(storeKey(), JSON.stringify(state)); renderNavBits(); }
function user(){ const a = accounts()[currentUser]; return a ? { name:a.name, initials:initialsOf(a.name), email:a.email, memberSince:a.created, tier:a.tier||'Principal', entity:a.entity||'' } : null; }
function renderNavBits(){
  const u = user();
  $('#navAuthed').classList.toggle('hidden', !u);
  $('#navGuest').classList.toggle('hidden', !!u);
  if (u){ $('#navCredits').textContent = state.credits; $('#navAvatar').textContent = u.initials; $('#navAvatar').title = u.name; }
  $$('.tabbar [data-route="stays"], .tabbar [data-route="apply"]').forEach(a => a.classList.toggle('hidden', !u));
}
function login(email, pw){
  const a = accounts()[email.trim().toLowerCase()];
  if (!a || a.pw !== hashPw(pw)) return false;
  currentUser = a.email; localStorage.setItem(SESSION_KEY, a.email); state = load(); save(); return true;
}
function logout(){ currentUser = null; localStorage.removeItem(SESSION_KEY); state = defaultState(); renderNavBits(); toast('Signed out'); navigate('#/'); }
function register({ name, email, pw, entity }){
  email = email.trim().toLowerCase(); const a = accounts();
  if (a[email]) return 'An account already exists for that email — sign in instead.';
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  a[email] = { email, name: name.trim(), pw: hashPw(pw), created: ymd(today()), tier:'Principal', entity };
  saveAccounts(a); return null;
}
function requireAuth(next){ if (user()) return true; navigate('#/login?next=' + encodeURIComponent(next || currentHash)); return false; }

let PROPS = [];
const byId = id => PROPS.find(p => p.id === id);

/* ── helpers ─────────────────────────────────────────────────────── */
const fmtM = n => '$' + (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1).replace(/\.0$/, '') + 'M';
const fmt = n => '$' + Math.round(n).toLocaleString('en-US');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ymd = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const parse = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const nightsBetween = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const longDate = s => parse(s).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
const shortDate = s => parse(s).toLocaleDateString('en-GB', { day:'numeric', month:'short' });
function hash(str){ let h = 2166136261; for (let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h>>>0); }
function rng(seed){ let s = seed || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(()=>t.classList.remove('show'), 3400); }
function icon(name){
  const I = {
    heart:'<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.5-9.3C1.2 8.5 3.3 5 6.9 5c2 0 3.4 1.1 4.1 2.2C11.7 6.1 13.1 5 15.1 5c3.6 0 5.7 3.5 4.4 6.7C17.5 16.4 12 21 12 21z"/></svg>',
    moon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    shield:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    plane:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M10.5 13.5L3 11l1.5-1.5L12 11l5.5-6.5a1.4 1.4 0 0 1 2 2L13 12l1.5 7.5L13 21l-2.5-7.5-3 3V20l-1.5 1-1.5-4-4-1.5 1-1.5h3.5z"/></svg>',
    car:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 13l2-5.5A2 2 0 0 1 6.9 6h10.2a2 2 0 0 1 1.9 1.5L21 13v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><circle cx="7.5" cy="14.5" r="1.2"/><circle cx="16.5" cy="14.5" r="1.2"/></svg>',
  }; return I[name] || '';
}
/* sprite support: the hosted demo packs each residence's photographs into vertical strips */
function pic(p, i, cls='', extra=''){
  if (p.sprite) return `<div class="sp ${cls}" data-sp="${p.id}" data-i="${i}" ${extra}></div>`;
  return `<img src="${p.images[i]}" class="${cls}" ${extra} alt="">`;
}
function fitSprites(root = document){
  $$('.sp[data-sp]', root).forEach(el => {
    const p = byId(el.dataset.sp); if (!p || !p.sprite) return;
    const S = p.sprite, i = +el.dataset.i, f = S.files[Math.floor(i / S.per)], k = i % S.per;
    const W = el.clientWidth || 300, H = el.clientHeight || 200;
    const sc = Math.max(W / S.w, H / S.h);
    el.style.backgroundImage = `url('${f}')`;
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundSize = `${S.w*sc}px auto`;
    el.style.backgroundPosition = `${(W - S.w*sc)/2}px ${(H - S.h*sc)/2 - k*S.h*sc}px`;
  });
}
window.addEventListener('resize', () => fitSprites(), { passive:true });
const hostedNightsFor = pid => blockedSet(pid).size; // demo: nights other investors have stayed / are booked

/* ── availability model (deterministic per property) ───────────── */
const blockedCache = {};
function blockedSet(pid){
  if (blockedCache[pid]) return blockedCache[pid];
  const set = new Set();
  const r = rng(hash(pid));
  const start = today();
  const n = 5 + Math.floor(r()*5);                   // 5–9 upcoming investor stays / owner blocks
  for (let i=0;i<n;i++){
    const off = Math.floor(r()*200);
    const len = 2 + Math.floor(r()*6);
    for (let k=0;k<len;k++) set.add(ymd(addDays(start, off+k)));
  }
  const own = 20 + Math.floor(r()*120); for (let k=0;k<10;k++) set.add(ymd(addDays(start, own+k)));
  blockedCache[pid] = set; return set;
}
function isBlocked(pid, dstr){
  if (blockedSet(pid).has(dstr)) return true;
  return state.stays.some(s => s.pid === pid && dstr >= s.from && dstr < s.to);
}
function myStayOn(pid, dstr){ return state.stays.some(s => s.pid === pid && dstr >= s.from && dstr < s.to); }

/* ── router ──────────────────────────────────────────────────────── */
const routes = {
  '': viewHome, 'browse': viewBrowse, 'property': viewProperty, 'how-it-works': viewHow,
  'apply': viewApply, 'list': viewApply, 'membership': viewHow, 'dashboard': viewDashboard,
  'login': viewLogin, 'signup': viewSignup, 'account': viewDashboard,
};
let currentHash = location.hash || '#/';
function navigate(h){
  currentHash = h.startsWith('#') ? h : '#' + h;
  try { if (location.hash !== currentHash) history.replaceState(null, '', currentHash); } catch (e) {}
  render();
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]'); if (!a) return;
  const href = a.getAttribute('href'); if (href === '#') { e.preventDefault(); return; }
  e.preventDefault(); navigate(href);
});
window.addEventListener('hashchange', () => { currentHash = location.hash || '#/'; render(); });
function parseHash(){
  let raw = currentHash; try { raw = decodeURIComponent(raw); } catch (e) {}
  const h = raw.replace(/^#\/?/, '');
  const [pathPart, qs] = h.split('?');
  const segs = pathPart.split('/').filter(Boolean);
  return { name: segs[0] || '', param: segs[1], query: Object.fromEntries(new URLSearchParams(qs || '')) };
}
let heroTimer = null;
function render(){
  const r = parseHash();
  const fn = routes[r.name] || viewHome;
  if (mapInstance){ mapInstance.remove(); mapInstance = null; }
  clearInterval(heroTimer);
  app.innerHTML = '';
  fn(r);
  fitSprites();
  window.scrollTo({ top: 0 });
  const key = r.name || 'home';
  $$('[data-route]').forEach(a => a.classList.toggle('active', a.dataset.route === key || (key==='list' && a.dataset.route==='apply')));
}

/* ── shared components ──────────────────────────────────────────── */
function card(p){
  const fav = state.watchlist.includes(p.id);
  return `<article class="card fade">
    <a href="#/property/${p.id}" class="ph">
      <img src="${p.thumb}" alt="${esc(p.name)}" loading="lazy">
      <span class="tag v">Vetted · Valued</span>
      <span class="tag photos">${p.images.length} photos</span>
    </a>
    <button class="fav ${fav?'on':''}" data-fav="${p.id}" aria-label="Save">${icon('heart')}</button>
    <div class="body">
      <span class="loc">${esc(p.city)} · ${esc(p.country)}</span>
      <h3><a href="#/property/${p.id}">${esc(p.name)}</a></h3>
      <div class="facts"><span><i>${p.beds}</i> beds</span><span><i>${p.baths}</i> baths</span>${p.sqm?`<span><i>${p.sqm.toLocaleString()}</i> m²</span>`:''}<span><i>${esc(p.type)}</i></span></div>
      <div class="arrive">${icon('plane')} ${esc(p.airports.private.code)} · ${esc(p.airports.private.label)} by car</div>
      <div class="price"><b>${fmtM(p.price)}</b><span>Valued ${fmtM(p.valuation)}</span></div>
    </div>
  </article>`;
}
function bindFavs(root = app){
  $$('[data-fav]', root).forEach(b => b.onclick = e => {
    e.preventDefault(); const id = b.dataset.fav;
    const i = state.watchlist.indexOf(id);
    if (i>-1){ state.watchlist.splice(i,1); b.classList.remove('on'); toast('Removed from your shortlist'); }
    else { state.watchlist.push(id); b.classList.add('on'); toast('Added to your shortlist'); }
    save();
  });
}
function modal(html, opts = {}){
  const root = $('#modalRoot');
  root.innerHTML = `<div class="modal"><div class="box ${opts.wide?'wide':''}"><button class="close" aria-label="Close">✕</button>${html}</div></div>`;
  const close = () => { root.innerHTML=''; document.body.style.overflow=''; document.onkeydown = null; };
  document.body.style.overflow='hidden';
  $('.close', root).onclick = close;
  $('.modal', root).onclick = e => { if (e.target.classList.contains('modal')) close(); };
  return { close, root };
}

/* ── HOME ────────────────────────────────────────────────────────── */
const HEROES = ['r19','r13','r41','r28','r44','r01','r40','r22'];
function viewHome(){
  const heroes = HEROES.map(byId).filter(Boolean);
  const featured = ['r46','r05','r12','r30','r38','r23'].map(byId).filter(Boolean);
  const total = PROPS.reduce((a,p)=>a+p.price,0);
  const regions = [
    ['Europe','r14'],['Americas','r45'],['Caribbean','r29'],['Asia-Pacific','r26'],['Middle East','r20'],['Alpine & Mountain','r35']
  ];
  const regionFilter = { 'Alpine & Mountain':'q=mountain' };
  app.innerHTML = `
  <section class="hero multi">
    <div class="slides">${heroes.map((p,i)=>`<div class="slide ${i===0?'on':''}" style="background-image:url('${p.hero}')"></div>`).join('')}</div>
    <div class="wrap">
      <div>
        <span class="eyebrow">The private exchange for luxury investment residences</span>
        <h1>Try before you buy.<br><em>Put idle assets to work.</em></h1>
        <p class="lead">Where principals, family offices, property funds and financial institutions acquire luxury residences worth holding, and list the ones their portfolio no longer needs. Every asset is vetted and independently valued, and open to a qualified buyer for a stay before any offer is made. And a property on the market no longer sits idle: every buyer-night it hosts earns you a night at any other residence on the exchange.</p>
        <div class="hero-actions">
          <a class="btn btn-gold" href="#/browse">Acquire — view the residences</a>
          <a class="btn btn-ghost" href="#/apply">List your property</a>
        </div>
      </div>
      <aside class="hero-card">
        <span class="eyebrow">At a glance</span>
        <div class="row"><span>Luxury residences, typically</span><b>$5M–$100M</b></div>
        <div class="row"><span>Fee to list</span><b>None</b></div>
        <div class="row"><span>Residency nights issued per asset</span><b>7</b></div>
        <div class="row"><span>Earned per night you host a buyer</span><b>+1</b></div>
        <div class="row"><span>Commission on completion, each side</span><b>0.5%</b></div>
      </aside>
    </div>
    <div class="hero-nav wrap">
      ${heroes.map((p,i)=>`<a href="#/property/${p.id}" class="hn ${i===0?'on':''}" data-i="${i}"><span class="bar"><i></i></span><b>${esc(p.name)}</b><small>${esc(p.city)} · ${fmtM(p.price)}</small></a>`).join('')}
    </div>
  </section>

  <section class="section dark" style="padding:70px 0">
    <div class="wrap"><p class="quote">“We put the Como house on the exchange to exit it. Eleven buyers stayed; the fourth made an offer at valuation. The nights we earned took us to Aspen and Dubai — and Dubai is now in the portfolio.”</p><p class="muted" style="margin-top:22px">— Single-family office, Geneva · Sale and acquisition completed Q3 2026</p></div>
  </section>

  <section class="section tight">
    <div class="wrap">
      <div class="stats">
        <div><b>${PROPS.length}</b><span>Vetted luxury assets live on the exchange today</span></div>
        <div><b>${fmtM(total)}</b><span>Aggregate asking value</span></div>
        <div><b>${new Set(PROPS.map(p=>p.country)).size}</b><span>Jurisdictions · private-aviation arrival on every listing</span></div>
        <div><b>0.5%</b><span>Commission each side · no retainer, no listing fee</span></div>
      </div>
    </div>
  </section>

  <section class="section dark">
    <div class="wrap">
      <span class="eyebrow">Due diligence in residence</span>
      <h2>No one should acquire a $50M asset<br>from a brochure.</h2>
      <p class="lead muted" style="max-width:760px;margin-top:16px;font-size:17px">A data room tells you what a residence earns. Only a residency tells you whether it is worth owning — how it sounds at night, how the staff run it, how the light falls on the water. Sojourn gives qualified buyers that diligence, and gives sellers the one thing that closes a trophy sale: a buyer who has already stayed in the house.</p>
      <div class="steps">
        <div class="step"><div class="n">01</div><h3>List your property, receive seven nights</h3><p>Apply to list a residence your portfolio no longer requires. Once title, valuation and ownership have passed vetting it goes live at no cost, and seven residency nights are credited to you.</p></div>
        <div class="step"><div class="n">02</div><h3>Have your property work for you</h3><p>A residence on the market elsewhere sits idle while it waits for a buyer. On Sojourn, every night a vetted investor spends in it is diligence on your asset — and adds one night to your balance, to spend visiting residences you are considering. The more buyers stay, the more you accumulate.</p></div>
        <div class="step"><div class="n">03</div><h3>Acquire: try before you buy</h3><p>Spend nights across the exchange — a lakefront villa on Como, a ranch under the Tetons, a penthouse above Central Park — and assess each as an owner would before committing capital.</p></div>
        <div class="step"><div class="n">04</div><h3>Complete at 0.5% a side</h3><p>Offers are made in-platform with counsel and escrow in the jurisdiction. Buyer and seller each pay 0.5% on completion. No membership, no retainer, nothing else.</p></div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="browse-head">
        <div><span class="eyebrow">Acquisition opportunities</span><h2>Assets open for residency this quarter</h2></div>
        <a class="btn btn-outline" href="#/browse">View all ${PROPS.length}</a>
      </div>
      <div class="grid">${featured.map(card).join('')}</div>
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="wrap">
      <div class="browse-head"><div><span class="eyebrow">By market</span><h2>Where the exchange holds assets</h2></div></div>
      <div class="scroller">
        ${regions.map(([r,pid]) => `<a class="region-tile" href="#/browse?${regionFilter[r] || 'region='+encodeURIComponent(r)}"><img src="${byId(pid).thumb}" alt=""><div class="cap"><b>${esc(r)}</b><span>${PROPS.filter(p => r==='Alpine & Mountain' ? /Aspen|Park City|Jackson|Queenstown|Montreux|Como/.test(p.city) : p.region===r).length} residences</span></div></a>`).join('')}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap split">
      ${pic(byId('r16'), 3, 'split-img')}
      <div>
        <span class="eyebrow">For sellers</span>
        <h2>The buyer who has slept in the house<br>does not renegotiate.</h2>
        <p style="margin-top:18px;font-size:16px;color:#3a3732">Trophy assets stall because buyers cannot price what they have not experienced. On Sojourn, every enquiry is a vetted principal with a residence of their own on the exchange, and every residency is a week of diligence done before the offer. Sales complete faster, closer to valuation, with fewer conditions — and the asset earns you nights at other residences for as long as it is listed.</p>
        <ul class="checks">
          <li>Independent valuation on every asset; asking price shown against it</li>
          <li>Private aviation and chauffeured arrival detailed for every residence</li>
          <li>Nights earned by hosting buyers never expire while the asset is live</li>
          <li>No membership, no retainer — an application to list, and 0.5% on completion</li>
        </ul>
        <a class="btn btn-dark" style="margin-top:28px" href="#/apply">List your property</a>
      </div>
    </div>
  </section>

  <section class="section dark" style="padding-bottom:110px">
    <div class="wrap">
      <span class="eyebrow">Access</span>
      <h2>Easy to look. Stringent to list.</h2>
      <div class="steps" style="margin-top:28px">
        <div class="step"><div class="n">01</div><h3>Create an account in a minute</h3><p>Anyone may open an account and view every residence, its valuation, data room and arrival details. No fee, no membership, no referral.</p></div>
        <div class="step"><div class="n">02</div><h3>Listing is vetted, rigorously</h3><p>To list a property, the asset, its title, its independent valuation and its beneficial owner all go through a stringent vetting process before anything is published. Approval typically takes 3–5 working days.</p></div>
        <div class="step"><div class="n">03</div><h3>Luxury only — no fixed minimum</h3><p>The exchange is for luxury residences, in practice $5M to $100M. There is no minimum asset value; each application is judged on the quality of the asset, not a price threshold.</p></div>
      </div>
      <div class="hero-actions" style="margin-top:34px">
        <a class="btn btn-gold" href="#/signup">Create an account</a>
        <a class="btn btn-ghost" href="#/apply">List your property</a>
      </div>
    </div>
  </section>`;
  bindFavs();
  // multi-hero rotation
  let i = 0; const slides = $$('.hero .slide'), navs = $$('.hero-nav .hn');
  const go = n => { i = n % slides.length; slides.forEach((s,k)=>s.classList.toggle('on',k===i)); navs.forEach((s,k)=>s.classList.toggle('on',k===i)); };
  heroTimer = setInterval(() => go(i+1), 6500);
  navs.forEach(n => n.onmouseenter = () => { go(+n.dataset.i); clearInterval(heroTimer); heroTimer = setInterval(() => go(i+1), 6500); });
}

/* ── BROWSE ──────────────────────────────────────────────────────── */
let mapInstance = null;
let TILES_OK = null;
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; OpenStreetMap contributors';
const tilesProbe = new Promise(res => { const im = new Image(); const done = v => { TILES_OK = v; res(v); }; im.onload = () => done(true); im.onerror = () => done(false); setTimeout(() => done(TILES_OK ?? false), 2500); im.src = 'https://tile.openstreetmap.org/1/0/0.png'; });
function svgAtlas(list, opts = {}){
  const W = 1000, H = 520, pad = 20;
  const x = lng => pad + (lng + 180) / 360 * (W - pad*2);
  const y = lat => pad + (1 - (lat + 60) / 150) * (H - pad*2);
  const grat = [];
  for (let lo=-180; lo<=180; lo+=30) grat.push(`<line x1="${x(lo)}" y1="${pad}" x2="${x(lo)}" y2="${H-pad}"/>`);
  for (let la=-60; la<=90; la+=30) grat.push(`<line x1="${pad}" y1="${y(la)}" x2="${W-pad}" y2="${y(la)}"/>`);
  const land = CONTINENTS.map(poly => `<polygon points="${poly.map(([la,lo])=>`${x(lo).toFixed(1)},${y(la).toFixed(1)}`).join(' ')}"/>`).join('');
  const pins = list.map(p => `<a href="#/property/${p.id}" class="pin"><circle cx="${x(p.lng).toFixed(1)}" cy="${y(p.lat).toFixed(1)}" r="${opts.single?9:5.5}"/><text x="${x(p.lng).toFixed(1)}" y="${(y(p.lat)-10).toFixed(1)}">${opts.single?esc(p.name):fmtM(p.price)}</text></a>`).join('');
  return `<svg class="atlas" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="background:#0e1116">
    <rect width="${W}" height="${H}" fill="#0e1116"/>
    <g stroke="rgba(255,255,255,.06)" stroke-width="1">${grat.join('')}</g>
    <g fill="#1d232c" stroke="#2b333e" stroke-width="1" stroke-linejoin="round">${land}</g>
    <g class="pins">${pins}</g>
  </svg>`;
}
const CONTINENTS = [
  [[72,-168],[70,-140],[60,-140],[58,-152],[55,-130],[48,-125],[40,-124],[32,-117],[23,-110],[16,-95],[8,-80],[0,-80],[-5,-81],[-15,-76],[-20,-70],[-35,-72],[-45,-75],[-54,-70],[-52,-68],[-40,-62],[-34,-52],[-23,-42],[-10,-36],[-2,-45],[5,-52],[10,-62],[12,-72],[20,-88],[25,-82],[30,-82],[31,-81],[35,-76],[40,-74],[44,-66],[47,-60],[50,-56],[55,-60],[60,-64],[64,-78],[70,-80],[74,-92],[70,-110],[72,-130]],
  [[36,-6],[43,-9],[48,-5],[51,1],[54,8],[57,8],[58,11],[62,5],[70,20],[71,30],[66,40],[62,30],[59,28],[56,21],[54,14],[53,10],[47,-2],[44,-2],[43,3],[43,7],[44,12],[40,18],[38,16],[40,14],[42,10],[44,8],[42,3],[38,-1],[36,-6]],
  [[36,-6],[32,-9],[28,-13],[21,-17],[15,-17],[8,-13],[5,-5],[4,8],[0,9],[-5,12],[-12,13],[-18,12],[-28,16],[-34,18],[-34,26],[-26,33],[-16,40],[-10,40],[-2,41],[8,49],[12,51],[12,44],[16,40],[22,37],[30,32],[32,24],[33,12],[37,10],[36,3],[36,-6]],
  [[42,27],[46,36],[44,40],[41,48],[37,48],[30,48],[25,52],[22,59],[25,57],[27,56],[22,60],[20,70],[12,78],[8,77],[15,80],[22,89],[16,95],[10,99],[2,103],[8,100],[14,100],[12,109],[20,107],[22,114],[28,121],[32,122],[37,123],[40,124],[43,132],[50,140],[60,160],[65,180],[70,170],[72,130],[76,110],[74,86],[70,70],[67,60],[62,50],[55,50],[48,48],[46,38],[42,27]],
  [[-12,131],[-11,136],[-14,141],[-10,142],[-17,146],[-22,150],[-28,153],[-33,152],[-37,150],[-39,146],[-38,141],[-35,137],[-32,134],[-34,124],[-33,116],[-26,114],[-20,118],[-16,123],[-12,131]],
  [[-34,173],[-37,175],[-39,177],[-41,175],[-42,172],[-46,167],[-45,170],[-42,174],[-40,173],[-37,176]],
  [[35,133],[38,139],[41,141],[44,145],[41,140],[37,137],[34,131],[33,130],[35,133]],
  [[60,-45],[66,-36],[72,-22],[80,-20],[82,-40],[78,-70],[70,-55],[62,-50]],
];
function viewBrowse({ query }){
  const f = { region: query.region || '', type: query.type || '', min: +query.min || 0, max: +query.max || 0, beds: +query.beds || 0, sort: query.sort || 'featured', q: query.q || '', view: query.view || 'grid' };
  const regions = [...new Set(PROPS.map(p=>p.region))];
  const types = [...new Set(PROPS.map(p=>p.type))].sort();
  app.innerHTML = `<section class="section tight"><div class="wrap">
    <div class="browse-head">
      <div><span class="eyebrow">Acquisition opportunities · all $20M+ · independently valued</span><h2 id="count"></h2></div>
      <div class="seg"><button data-view="grid" class="${f.view==='grid'?'on':''}">Grid</button><button data-view="map" class="${f.view==='map'?'on':''}">Map</button></div>
    </div>
    <div class="filters" id="filters">
      <input type="search" name="q" placeholder="City, country or airport code" value="${esc(f.q)}">
      <select name="region"><option value="">All regions</option>${regions.map(r=>`<option ${f.region===r?'selected':''}>${r}</option>`).join('')}</select>
      <select name="type"><option value="">All types</option>${types.map(r=>`<option ${f.type===r?'selected':''}>${r}</option>`).join('')}</select>
      <select name="min"><option value="0">Min price</option>${[20,30,50,75,100].map(v=>`<option value="${v}" ${f.min===v?'selected':''}>$${v}M+</option>`).join('')}</select>
      <select name="max"><option value="0">Max price</option>${[30,50,75,100,150,200].map(v=>`<option value="${v}" ${f.max===v?'selected':''}>Up to $${v}M</option>`).join('')}</select>
      <select name="beds"><option value="0">Any beds</option>${[4,5,6,8,10].map(v=>`<option value="${v}" ${f.beds===v?'selected':''}>${v}+ beds</option>`).join('')}</select>
      <select name="sort"><option value="featured" ${f.sort==='featured'?'selected':''}>Featured</option><option value="price-asc" ${f.sort==='price-asc'?'selected':''}>Price · low to high</option><option value="price-desc" ${f.sort==='price-desc'?'selected':''}>Price · high to low</option><option value="arrival" ${f.sort==='arrival'?'selected':''}>Shortest drive from jet</option><option value="new" ${f.sort==='new'?'selected':''}>Newest</option></select>
    </div>
    <div class="browse-layout ${f.view==='map'?'with-map':''}" style="margin-top:28px">
      <div class="grid" id="results"></div>
      ${f.view==='map'?'<div id="map"></div>':''}
    </div>
  </div></section>`;

  const applyFilters = () => {
    const q = f.q.toLowerCase();
    let list = PROPS.filter(p =>
      (!f.region || p.region===f.region) && (!f.type || p.type===f.type) &&
      (!f.min || p.price >= f.min*1e6) && (!f.max || p.price <= f.max*1e6) && (!f.beds || p.beds >= f.beds) &&
      (!q || (p.city+' '+p.country+' '+p.name+' '+p.airports.commercial.code+' '+p.airports.private.code+' '+p.airports.private.name).toLowerCase().includes(q) || (q==='mountain' && /Aspen|Park City|Jackson|Queenstown|Montreux|Como/.test(p.city))));
    const sorters = { 'price-asc':(a,b)=>a.price-b.price, 'price-desc':(a,b)=>b.price-a.price, 'arrival':(a,b)=>a.airports.private.minutes-b.airports.private.minutes, 'new':(a,b)=>a.listedDays-b.listedDays, 'featured':()=>0 };
    list.sort(sorters[f.sort]);
    $('#count').textContent = `${list.length} residence${list.length===1?'':'s'}`;
    $('#results').innerHTML = list.length ? list.map(card).join('') : '<div class="empty" style="grid-column:1/-1">No residences match. Loosen a filter or two.</div>';
    bindFavs();
    if (f.view==='map') drawMap(list);
  };
  const pushQuery = () => {
    const qs = new URLSearchParams(); Object.entries(f).forEach(([k,v]) => { if (v && !(k==='sort'&&v==='featured') && !(k==='view'&&v==='grid')) qs.set(k, v); });
    currentHash = '#/browse' + (qs.toString()?'?'+qs:''); try { history.replaceState(null, '', currentHash); } catch (e) {}
  };
  $('#filters').oninput = e => { const {name, value} = e.target; f[name] = ['min','max','beds'].includes(name) ? +value : value; pushQuery(); applyFilters(); };
  $$('.seg button').forEach(b => b.onclick = () => { f.view = b.dataset.view; pushQuery(); render(); });
  applyFilters();
}
function drawMap(list){
  if (TILES_OK === null) { tilesProbe.then(() => { if ($('#map')) drawMap(list); }); return; }
  if (TILES_OK === false || typeof L === 'undefined') { if (mapInstance) { mapInstance.remove(); mapInstance = null; } $('#map').innerHTML = svgAtlas(list); return; }
  if (!mapInstance){
    mapInstance = L.map('map', { scrollWheelZoom: true, worldCopyJump: true }).setView([25, 10], 2);
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 18 }).addTo(mapInstance);
    mapInstance._layer = L.layerGroup().addTo(mapInstance);
  }
  mapInstance._layer.clearLayers();
  list.forEach(p => {
    const ic = L.divIcon({ className: '', html: `<div class="price-marker ${state.watchlist.includes(p.id)?'hot':''}">${fmtM(p.price)}</div>`, iconSize: [0,0] });
    L.marker([p.lat, p.lng], { icon: ic }).addTo(mapInstance._layer)
      .bindPopup(`<a class="pop" href="#/property/${p.id}"><img src="${p.thumb}"><div class="b"><b>${esc(p.name)}</b><span>${esc(p.city)} · ${fmtM(p.price)} · ${p.beds} beds</span></div></a>`);
  });
  if (list.length) mapInstance.fitBounds(list.map(p=>[p.lat,p.lng]), { padding:[40,40], maxZoom: 6 });
}

/* ── PROPERTY DETAIL + BOOKING ──────────────────────────────────── */
function viewProperty({ param }){
  const p = byId(param); if (!p) return viewBrowse({query:{}});
  const fav = state.watchlist.includes(p.id);
  const isMine = state.listings.includes(p.id);
  const diff = ((p.price - p.valuation)/p.valuation*100);
  const A = p.airports;
  const apBlock = (a, label) => `<div class="ap">
      <div class="ap-head">${icon(a.kind==='private'?'plane':'plane')}<span class="eyebrow">${label}</span></div>
      <b>${esc(a.name)}</b><small>${esc(a.code)} · ${a.km} km by road</small>
      <div class="drive">${icon('car')}<span><b>${esc(a.label)}</b> ${a.transfer ? '' : 'by Maybach or limousine'}</span></div>
      ${a.transfer?`<p class="transfer">${esc(a.transfer)}</p>`:''}
    </div>`;
  app.innerHTML = `<div class="wrap detail">
    <div class="detail-top">
      <div>
        <span class="eyebrow">${esc(p.city)} · ${esc(p.country)} · ${esc(p.type)}</span>
        <h1>${esc(p.name)}</h1>
        <p class="muted" style="font-size:16px;margin-top:6px">${esc(p.tagline)}</p>
      </div>
      <div class="pill-row">
        <button class="btn btn-outline btn-sm" data-fav="${p.id}" id="favBtn">${fav?'♥ Shortlisted':'♡ Shortlist'}</button>
        <button class="btn btn-outline btn-sm" id="shareBtn">Share</button>
      </div>
    </div>
    <div class="gallery" id="gallery">
      ${p.images.slice(0,5).map((src,i)=>pic(p, i, i===0?'main':'', `data-i="${i}"`)).join('')}
      <button class="all-photos" id="allPhotos">View all ${p.images.length} photographs</button>
    </div>
    <div class="detail-layout">
      <div>
        <div class="facts-row">
          <div><b>${p.beds}</b><span>Bedrooms</span></div>
          <div><b>${p.baths}</b><span>Bathrooms</span></div>
          ${p.sqm?`<div><b>${p.sqm.toLocaleString()}</b><span>m² interior</span></div>`:''}
          ${p.lot?`<div><b>${esc(p.lot)}</b><span>Plot</span></div>`:''}
          ${p.yearBuilt?`<div><b>${p.yearBuilt}</b><span>Built</span></div>`:''}
          <div><b>${p.images.length}</b><span>Photographs</span></div>
        </div>
        <p class="desc">${esc(p.description[0])}</p>
        ${p.description[1]?`<p class="desc">${esc(p.description[1])}</p>`:''}

        ${p.details ? detailsBlock(p) : ''}

        <span class="eyebrow">Arrival</span>
        <div class="arrival">
          ${apBlock(A.private, 'Nearest private aviation')}
          ${apBlock(A.commercial, 'Nearest international airport')}
        </div>
        <p class="note" style="text-align:left;margin:-14px 0 30px">Drive times are rough chauffeured estimates for planning; your house manager confirms the transfer on booking.</p>

        <div class="valuation">
          <div><span class="eyebrow">Independent valuation</span><div class="big">${fmtM(p.valuation)}</div><small>${esc(p.valuationBy)} · ${longDate(p.valuationDate)}</small></div>
          <div><span class="eyebrow">Asking vs. valuation</span><div class="big" style="color:${diff<=0?'#8fd3a8':'#f3ede1'}">${diff>0?'+':''}${diff.toFixed(1)}%</div><small>${diff<=0?'Priced at or below independent valuation':'Premium to valuation — reflects turnkey contents &amp; management'}</small></div>
          <div style="grid-column:1/-1;display:flex;gap:10px;flex-wrap:wrap;font-size:12.5px;color:#aaa397">${icon('shield')} Owner vetted · Title verified · Valuation report in data room · Furnishings inventory attached</div>
        </div>

        <span class="eyebrow">Investment profile</span>
        <div class="fin">
          <div><b>${p.grossYield}%</b><span>Est. gross yield (managed lets)</span></div>
          <div><b>${fmt(p.nightlyEquivalent)}</b><span>Implied nightly rate</span></div>
          <div><b>${hostedNightsFor(p.id)}</b><span>Investor nights hosted, next 6 months</span></div>
        </div>

        <span class="eyebrow">Turnkey inclusions &amp; amenities</span>
        <ul class="amen">${p.amenities.map(a=>`<li>${esc(a)}</li>`).join('')}<li>Full furniture, art &amp; linen inventory</li><li>Management &amp; staff contracts assignable</li></ul>

        <span class="eyebrow">Location</span>
        <div id="miniMap" style="height:300px;border-radius:var(--r-lg);overflow:hidden;border:1px solid var(--line);margin:14px 0 36px;background:var(--sand)"></div>

        <span class="eyebrow">Ownership &amp; transaction</span>
        <table class="table" style="margin-top:10px">
          <tr><td>Vendor</td><td>${esc(p.owner)}</td></tr>
          <tr><td>Address</td><td>${esc(p.address)}</td></tr>
          ${p.localPrice?`<tr><td>Local asking price</td><td>${esc(p.localPrice)} (${esc(p.localCurrency)})</td></tr>`:''}
          <tr><td>Published</td><td>${p.listedDays} days ago</td></tr>
          <tr><td>Commission</td><td>0.5% paid by buyer (${fmt(p.price*0.005)}) · 0.5% paid by seller (${fmt(p.price*0.005)}) · on completion via escrow</td></tr>
          <tr><td>Listing source</td><td>${esc(p.broker)} · <a href="${esc(p.sourceUrl)}" target="_blank" rel="noopener" style="text-decoration:underline">public listing ↗</a></td></tr>
        </table>
      </div>

      <aside>
        <div class="book" id="book"></div>
      </aside>
    </div>
  </div>`;

  const dt = $('#detToggle'); if (dt) dt.onclick = () => { const b = $('#detBody'); const open = b.classList.toggle('open'); dt.textContent = open ? 'Hide full details' : 'Show full details'; };
  $$('#gallery img, #gallery .sp').forEach(img => img.onclick = () => lightbox(p, +img.dataset.i));
  $('#allPhotos').onclick = () => lightbox(p, 0);
  $('#favBtn').onclick = () => { const i = state.watchlist.indexOf(p.id); if (i>-1) state.watchlist.splice(i,1); else state.watchlist.push(p.id); save(); $('#favBtn').textContent = state.watchlist.includes(p.id)?'♥ Shortlisted':'♡ Shortlist'; };
  $('#shareBtn').onclick = () => { try { navigator.clipboard?.writeText(location.href); } catch (e) {} toast('Private link copied — valid for vetted investors'); };
  tilesProbe.then(ok => {
  if (!$('#miniMap')) return;
  if (!ok || typeof L === 'undefined'){
    $('#miniMap').innerHTML = svgAtlas([p], { single:true });
  } else {
    const m = L.map('miniMap', { scrollWheelZoom:false }).setView([p.lat, p.lng], 11);
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR }).addTo(m);
    L.circle([p.lat, p.lng], { radius: 1800, color:'#c6a15b', fillColor:'#c6a15b', fillOpacity:.25, weight:2 }).addTo(m);
    mapInstance = m;
  }
  });
  bookingWidget(p, isMine);
}


function detailsBlock(p){
  const D = p.details;
  const facts = (D.facts||[]).map(([k,v])=>`<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('');
  const secs = (D.sections||[]).map(sec=>`<div class="det-sec"><h4>${esc(sec.name)}</h4><dl>${sec.items.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>`).join('');
  return `<div class="details" id="details">
    <div class="det-head"><div><span class="eyebrow">Details</span><h3>Listing particulars</h3><p class="muted" style="font-size:13px">As published by ${esc(p.broker)}${D.agent?` · listing advisor ${esc(D.agent)}`:''}. Reproduced for demonstration.</p></div><button class="btn btn-outline btn-sm" id="detToggle">Show full details</button></div>
    <div class="det-body" id="detBody">
      ${D.fullDescription ? `<div class="det-sec wide"><h4>Full description</h4>${D.fullDescription.split(/\n+/).map(x=>`<p>${esc(x)}</p>`).join('')}</div>` : ''}
      <div class="det-sec wide"><h4>Listing details</h4><table class="table det-table">${facts}</table></div>
      ${secs}
    </div>
  </div>`;
}

function lightbox(p, i){
  const images = p.images; let idx = i;
  const m = modal(`<div class="lightbox"><button class="ctr l">‹</button><div class="lb-main" id="lbMain"></div><button class="ctr r">›</button><div class="lb-count" id="lbCount"></div><div class="lb-strip" id="lbStrip">${images.map((s,k)=>p.sprite?`<div class="sp t ${k===idx?'on':''}" data-sp="${p.id}" data-i="${k}" data-k="${k}"></div>`:`<img src="${s}" data-k="${k}" class="${k===idx?'on':''}" loading="lazy">`).join('')}</div></div>`, { wide:true });
  const show = () => {
    $('#lbMain').innerHTML = p.sprite ? `<div class="sp main" data-sp="${p.id}" data-i="${idx}"></div>` : `<img src="${images[idx]}" alt="">`;
    $('#lbCount').textContent = `${idx+1} / ${images.length}`;
    $$('#lbStrip > *').forEach((t,k)=>t.classList.toggle('on',k===idx));
    fitSprites(m.root);
    const on = $('#lbStrip .on'); on && on.scrollIntoView({ inline:'center', block:'nearest', behavior:'smooth' });
  };
  $('.ctr.l', m.root).onclick = () => { idx = (idx-1+images.length)%images.length; show(); };
  $('.ctr.r', m.root).onclick = () => { idx = (idx+1)%images.length; show(); };
  $$('#lbStrip > *').forEach(t => t.onclick = () => { idx = +t.dataset.k; show(); });
  document.onkeydown = e => { if (e.key==='Escape') m.close(); if (e.key==='ArrowRight') $('.ctr.r', m.root)?.click(); if (e.key==='ArrowLeft') $('.ctr.l', m.root)?.click(); };
  show();
}

/* ── Booking calendar (Airbnb-style) ────────────────────────────── */
function bookingWidget(p, isMine){
  const box = $('#book');
  let sel = { from: null, to: null };
  let monthCursor = new Date(today().getFullYear(), today().getMonth(), 1);
  const two = () => window.matchMedia('(min-width: 721px)').matches;

  const draw = () => {
    const nights = sel.from && sel.to ? nightsBetween(sel.from, sel.to) : 0;
    const can = nights > 0 && nights <= state.credits;
    box.innerHTML = `
      <div class="price-line"><b>${fmtM(p.price)}</b><span class="muted">asking${p.localPrice?` · ${esc(p.localPrice)}`:''}</span></div>
      <div class="commission">0.5% buyer · 0.5% seller · paid on completion only</div>
      ${isMine ? `<div class="badge green">Your residence</div><p class="note" style="text-align:left;margin:10px 0 0">You received 7 nights when this residence was approved. Every night an investor stays here adds <b>+1 night</b> to your balance. ${hostedNightsFor(p.id)} investor nights are booked over the next six months.</p>` : `
      <span class="eyebrow">Reserve a residency · diligence in person</span>
      <div class="date-inputs" style="margin-top:10px">
        <div><label>Arrive</label><span>${sel.from?longDate(sel.from):'Select date'}</span></div>
        <div><label>Depart</label><span>${sel.to?longDate(sel.to):'Select date'}</span></div>
      </div>`}
      <div class="cal" id="cal"></div>
      <div class="legend"><span><i style="background:var(--ink)"></i>Selected</span><span><i style="background:#e6e0d3"></i>Unavailable</span><span><i style="background:var(--gold)"></i>Your stays</span></div>
      ${isMine ? '' : `
      <div class="divider"></div>
      <div class="credit-line"><span>${nights||'—'} night${nights===1?'':'s'} × 1 night credit</span><b>${nights||0} nights</b></div>
      <div class="credit-line"><span>Your balance</span><b>${user()?state.credits+' nights':'—'}</b></div>
      <div class="credit-line" style="border-top:1px solid var(--line);margin-top:6px;padding-top:12px"><span>Balance after stay</span><b style="color:${state.credits-nights<0?'var(--red)':'inherit'}">${state.credits-nights} nights</b></div>
      <button class="btn btn-gold btn-block" id="reserve" ${(can||(!user()&&nights>0))?'':'disabled'} style="margin-top:14px">${!user()?(nights===0?'Select dates — sign in to reserve':'Sign in to reserve'):nights===0?'Select your dates':nights>state.credits?`Needs ${nights-state.credits} more night${nights-state.credits===1?'':'s'}`:'Reserve residency'}</button>
      <p class="note">No charge. The vendor earns +${nights||1} night${(nights||1)===1?'':'s'} for hosting your diligence.<br>Minimum 2 nights · residencies are hosted, never rented.</p>
      <div class="divider"></div>
      <button class="btn btn-outline btn-block" id="offer">Make an offer</button>
      <button class="btn btn-block" id="dataroom" style="margin-top:6px;font-weight:600;font-size:13px">Request data room access →</button>`}
    `;
    drawCal();
    if (!isMine){
      $('#reserve').onclick = reserve;
      $('#offer').onclick = () => { if (requireAuth(`#/property/${p.id}`)) offerModal(p); };
      $('#dataroom').onclick = () => toast('Data room request sent to vendor — expect access within 24h');
    }
  };

  const drawCal = () => {
    const months = two() ? [monthCursor, new Date(monthCursor.getFullYear(), monthCursor.getMonth()+1, 1)] : [monthCursor];
    const minMonth = new Date(today().getFullYear(), today().getMonth(), 1);
    $('#cal').innerHTML = `
      <div class="cal-head">
        <button id="prev" ${monthCursor<=minMonth?'disabled':''}>‹</button>
        <span class="muted" style="font-size:12.5px">${sel.from && !sel.to ? 'Now choose departure' : 'Select arrival'}</span>
        <button id="next">›</button>
      </div>
      <div class="cal-months ${two()?'two':''}">${months.map(monthHTML).join('')}</div>`;
    $('#prev').onclick = () => { monthCursor = new Date(monthCursor.getFullYear(), monthCursor.getMonth()-1, 1); drawCal(); };
    $('#next').onclick = () => { monthCursor = new Date(monthCursor.getFullYear(), monthCursor.getMonth()+1, 1); drawCal(); };
    $$('.d[data-d]').forEach(d => d.onclick = () => pick(d.dataset.d));
  };

  const monthHTML = (m) => {
    const first = new Date(m.getFullYear(), m.getMonth(), 1);
    const dow = (first.getDay()+6)%7;
    const dim = new Date(m.getFullYear(), m.getMonth()+1, 0).getDate();
    const t = ymd(today());
    let cells = '';
    for (let i=0;i<dow;i++) cells += '<span></span>';
    for (let d=1; d<=dim; d++){
      const ds = ymd(new Date(m.getFullYear(), m.getMonth(), d));
      const past = ds < t;
      const blocked = isBlocked(p.id, ds);
      const mine = myStayOn(p.id, ds);
      const inRange = sel.from && sel.to && ds > sel.from && ds < sel.to;
      const cls = ['d', past?'past':'', (blocked && !past)?'x':'', mine?'booked':'', ds===sel.from?'start':'', ds===sel.to?'end':'', (inRange||((ds===sel.from||ds===sel.to)&&sel.from&&sel.to))?'in':''].join(' ');
      const clickable = !past && !(blocked && ds !== sel.to && !(sel.from && !sel.to && ds > sel.from));
      cells += `<span class="${cls}" ${clickable?`data-d="${ds}"`:''} title="${blocked?'Unavailable':''}">${d}</span>`;
    }
    return `<div class="month"><h4>${m.toLocaleDateString('en-GB',{month:'long',year:'numeric'})}</h4><div class="dow">${['M','T','W','T','F','S','S'].map(x=>`<span>${x}</span>`).join('')}</div><div class="days">${cells}</div></div>`;
  };

  const pick = (ds) => {
    if (isMine) { toast('Owner view: dates with a gold dot are investor residencies'); return; }
    if (!sel.from || (sel.from && sel.to)) { if (isBlocked(p.id, ds)) return; sel = { from: ds, to: null }; }
    else {
      if (ds <= sel.from) { if (isBlocked(p.id, ds)) return; sel = { from: ds, to: null }; }
      else {
        let cur = parse(sel.from); let ok = true;
        while (ymd(cur) < ds){ if (isBlocked(p.id, ymd(cur))) { ok = false; break; } cur = addDays(cur,1); }
        if (!ok){ toast('That range crosses unavailable nights'); sel = { from: ds, to: null }; if (isBlocked(p.id, ds)) sel = {from:null,to:null}; }
        else if (nightsBetween(sel.from, ds) < 2){ toast('Minimum residency is 2 nights'); return; }
        else sel.to = ds;
      }
    }
    draw();
  };

  const reserve = () => {
    if (!requireAuth(`#/property/${p.id}`)) return;
    const nights = nightsBetween(sel.from, sel.to);
    if (nights > state.credits) return;
    const A = p.airports.private;
    const m = modal(`
      <span class="eyebrow">Confirm residency</span>
      <h3 style="margin:8px 0 4px">${esc(p.name)}</h3>
      <p class="muted">${esc(p.city)}</p>
      <div class="divider" style="height:1px;background:var(--line);margin:18px 0"></div>
      <div class="credit-line"><span>Arrive</span><b>${longDate(sel.from)} · from 16:00</b></div>
      <div class="credit-line"><span>Depart</span><b>${longDate(sel.to)} · by 11:00</b></div>
      <div class="credit-line"><span>Nights</span><b>${nights}</b></div>
      <div class="credit-line"><span>Nights used</span><b>${nights} of ${state.credits}</b></div>
      <div class="credit-line"><span>Chauffeur from ${esc(A.code)}</span><b>${esc(A.label)}</b></div>
      <p class="note" style="text-align:left;margin-top:14px">The owner is notified and has 24 hours to confirm; they earn ${nights} night${nights===1?'':'s'} for hosting you. House manager contact, arrival notes and the Maybach transfer follow on confirmation. Residencies are for evaluation; guests are limited to you and up to ${Math.min(p.beds*2, 10)} named companions.</p>
      <button class="btn btn-gold btn-block" id="confirm" style="margin-top:18px">Confirm &amp; use ${nights} night${nights===1?'':'s'}</button>`);
    $('#confirm', m.root).onclick = () => {
      state.stays.push({ id: 'S'+Date.now().toString(36).toUpperCase(), pid: p.id, from: sel.from, to: sel.to, nights, created: ymd(today()), status: 'Awaiting owner confirmation' });
      state.credits -= nights; save(); m.close(); sel = { from:null, to:null }; draw();
      toast(`Residency reserved — ${nights} night${nights===1?'':'s'} used. ${state.credits} remaining.`);
    };
  };
  draw();
  window.addEventListener('resize', () => { if ($('#cal')) drawCal(); }, { passive:true });
}

function offerModal(p){
  const start = Math.round(p.price*0.95/250000)*250000;
  const m = modal(`
    <span class="eyebrow">Make an offer</span>
    <h3 style="margin:8px 0 14px">${esc(p.name)}</h3>
    <div class="form">
      <div><label>Offer price (USD)</label><input id="offerPrice" type="number" step="250000" value="${start}"></div>
      <div class="two"><div><label>Funding</label><select><option>Cash</option><option>Cash + lending</option><option>Exchange / rollover</option></select></div><div><label>Target completion</label><select><option>30 days</option><option>60 days</option><option>90 days</option></select></div></div>
      <div><label>Note to vendor (optional)</label><textarea placeholder="Conditions, inclusions, timing…"></textarea></div>
      <div class="credit-line" style="border-top:1px solid var(--line);padding-top:12px"><span>Your commission (0.5%, buyer side)</span><b id="commB">${fmt(start*0.005)}</b></div>
      <div class="credit-line"><span>Vendor's commission (0.5%, seller side)</span><b id="commS">${fmt(start*0.005)}</b></div>
      <button class="btn btn-dark btn-block" id="sendOffer">Submit offer via counsel</button>
      <p class="note">Both commissions are paid from escrow on completion. Nothing is payable if the sale does not complete.</p>
    </div>`);
  $('#offerPrice', m.root).oninput = e => { const v = (+e.target.value||0)*0.005; $('#commB', m.root).textContent = fmt(v); $('#commS', m.root).textContent = fmt(v); };
  $('#sendOffer', m.root).onclick = () => { state.offers.push({ pid:p.id, price:+$('#offerPrice', m.root).value, date: ymd(today()), status:'With vendor' }); save(); m.close(); toast('Offer submitted — your counsel and the vendor have been notified'); };
}

/* ── HOW IT WORKS ───────────────────────────────────────────────── */
function viewHow(){
  const ex = byId('r14');
  app.innerHTML = `
  <section class="section dark"><div class="wrap">
    <span class="eyebrow">How the exchange works</span>
    <h1 style="font-size:clamp(36px,5vw,64px)">Acquire with diligence.<br>List with conviction.</h1>
    <p class="lead muted" style="max-width:720px;margin-top:18px;font-size:17px">Sojourn is a closed exchange of luxury investment residences held by principals, high-net-worth individuals, family offices, property funds and financial institutions, who open them to one another. Buyers stay in an asset before they bid; sellers put a property that would otherwise sit idle on the market to work, earning nights at other residences. Creating an account takes a minute; listing a property means stringent vetting of the asset and its owner. There is no membership and no fee to list — the working currency is nights.</p>
  </div></section>
  <section class="section"><div class="wrap">
    <div class="steps" style="margin-top:0">
      <div class="step light"><div class="n">01</div><h3>List your property</h3><p>Submit a luxury residence that your portfolio no longer requires — usually $5M to $100M, with no fixed minimum — with an independent valuation and 20+ photographs. Title, valuation and beneficial ownership go through stringent vetting. Approval usually takes 3–5 working days; listing is free.</p></div>
      <div class="step light"><div class="n">02</div><h3>Seven residency nights, issued</h3><p>On approval, seven nights are credited to you. One night = one night of in-person diligence at any residence on the exchange.</p></div>
      <div class="step light"><div class="n">03</div><h3>Your property works for you</h3><p>Instead of sitting idle while it sells, your residence earns: every night a vetted investor stays is diligence on your asset — and adds one night to your balance. An asset that hosts twenty buyer-nights a year funds twenty nights of your own acquisition search.</p></div>
      <div class="step light"><div class="n">04</div><h3>Acquire and complete</h3><p>Offers are made in-platform; we introduce counsel and escrow in the jurisdiction. Buyer pays 0.5% and seller pays 0.5% of the completed price, from escrow. Nothing else.</p></div>
    </div>
  </div></section>
  <section class="section" style="padding-top:0"><div class="wrap split">
    <div>
      <span class="eyebrow">Worked example</span>
      <h2>${esc(ex.name)} · ${fmtM(ex.price)}</h2>
      <table class="table" style="margin-top:20px">
        <tr><td>Fee to publish</td><td><b>$0</b></td></tr>
        <tr><td>Independent valuation (owner arranges)</td><td>Required</td></tr>
        <tr><td>Nights issued to owner on approval</td><td><b>7</b></td></tr>
        <tr><td>Buyer residencies hosted in year one</td><td>e.g. 5 stays · 18 nights → <b>+18 nights</b></td></tr>
        <tr><td>Vendor's balance after year one</td><td><b>25 nights</b> of diligence anywhere on the exchange</td></tr>
        <tr><td>Completion at ${fmtM(ex.price)}</td><td>Buyer <b>${fmt(ex.price*0.005)}</b> · Seller <b>${fmt(ex.price*0.005)}</b> (0.5% each)</td></tr>
      </table>
      <a class="btn btn-gold" href="#/browse" style="margin-top:26px">Explore residences</a>
    </div>
    ${pic(ex, 2, 'split-img')}
  </div></section>
  <section class="section dark"><div class="wrap">
    <span class="eyebrow">Questions</span>
    <h2 style="margin-bottom:28px">Frequently asked</h2>
    <div class="grid" style="gap:40px">
      ${[
        ['Who is the exchange for?','Principals, high-net-worth individuals, family offices, property funds and financial institutions who hold luxury investment residences and want to acquire or sell them between qualified parties, privately, with diligence done in person.'],
        ['Is there a minimum asset value?','No. The exchange is for luxury residences — in practice $5M to $100M — and there is no fixed minimum. Each application is judged on the quality of the asset, not a price threshold.'],
        ['Is this a membership club?','No. There is no membership and no subscription. Creating an account takes a minute and lets you view every residence. Listing a property is different: the asset, its title, its valuation and its beneficial owner go through a stringent vetting process before it is published.'],
        ['Why list here rather than leave it with an agent?','Because elsewhere a property on the market sits idle. On Sojourn every buyer-night it hosts earns you a night at any other residence on the exchange — your property works for you while it sells, and the buyers who stay arrive at the offer already convinced.'],
        ['Who can stay in my residence?','Only vetted principals with nights in their balance — every guest has an asset of their own on the exchange. Residencies are hosted diligence visits, not lettings; no money changes hands and your house manager remains in place.'],
        ['How do I earn more nights?','Host buyers. Each night an investor stays at your residence adds one night to your balance. You may also publish a second residence for another seven.'],
        ['Can I buy nights?','No. Nights are only issued for publishing and earned by hosting buyers. That keeps the exchange two-sided: everyone staying in your asset is a seller too.'],
        ['What does turnkey mean here?','Furniture, art, linen, kitchen, AV, vehicles where listed, and assignable management and staff contracts. A full inventory is attached to every listing.'],
        ['Who pays the commission?','Both parties, equally: 0.5% from the buyer and 0.5% from the seller, paid from escrow on completion. If no sale completes, nothing is owed.'],
        ['How is arrival handled?','Each listing shows the nearest private-aviation field and international airport with a rough chauffeured drive time. On booking, the house manager arranges the Maybach or limousine — or the launch, tender or helicopter where the last leg is by water or air.'],
        ['Which currencies?','Prices are displayed in USD; local asking prices are shown where the listing is in another currency. Completion occurs in local currency with FX fixed at exchange of contracts.'],
      ].map(([q,a])=>`<div><h3 style="margin-bottom:8px">${q}</h3><p class="muted">${a}</p></div>`).join('')}
    </div>
  </div></section>`;
}

/* ── APPLY TO PUBLISH (multi-step) ──────────────────────────────── */
function viewApply(){
  if (!requireAuth('#/apply')) return;
  const U = user();
  let step = 0; const data = {};
  const steps = ['Residence', 'Valuation & documents', 'Owner vetting', 'Review'];
  const wrap = () => `<section class="section"><div class="wrap" style="max-width:860px">
    <span class="eyebrow">List your property</span>
    <h1 style="font-size:clamp(34px,4.5vw,56px);margin-bottom:8px">Release an asset from the portfolio.<br><span class="muted" style="font-size:.6em">Publish free, receive seven nights, earn one more for every buyer-night you host.</span></h1>
    <p class="muted" style="margin-bottom:28px">There is no membership, but every listing is stringently vetted: title, independent valuation and beneficial ownership are verified before anything is published. Approval typically takes 3–5 working days; nights are credited on approval and the residence becomes visible to vetted buyers.</p>
    <div class="stepper">${steps.map((s,i)=>`<div class="${i===step?'on':i<step?'done':''}">${i+1}. ${s}</div>`).join('')}</div>
    <div class="panel" id="stepBox"></div>
  </div></section>`;
  app.innerHTML = wrap();
  const box = () => $('#stepBox');
  const forms = [
    () => `<form class="form" id="f">
      <div class="two"><div><label>Residence name</label><input name="name" required value="${esc(data.name||'')}" placeholder="e.g. Villa Les Cèdres"></div><div><label>Type</label><select name="type">${['Villa','Estate','Mansion','Penthouse','Townhouse','Castle','Ranch','Chalet','Private Island'].map(t=>`<option ${data.type===t?'selected':''}>${t}</option>`).join('')}</select></div></div>
      <div class="two"><div><label>City / area</label><input name="city" required value="${esc(data.city||'')}" placeholder="e.g. Saint-Jean-Cap-Ferrat"></div><div><label>Country</label><input name="country" required value="${esc(data.country||'')}"></div></div>
      <div class="two"><div><label>Asking price (USD)</label><input name="price" type="number" min="1000000" step="250000" required value="${data.price||''}" placeholder="e.g. 25,000,000 — luxury residences, usually $5M–$100M"></div><div><label>Interior m²</label><input name="sqm" type="number" required value="${data.sqm||''}"></div></div>
      <div class="two"><div><label>Bedrooms</label><input name="beds" type="number" required value="${data.beds||''}"></div><div><label>Bathrooms</label><input name="baths" type="number" required value="${data.baths||''}"></div></div>
      <div class="two"><div><label>Nearest private-aviation field</label><input name="apPriv" value="${esc(data.apPriv||'')}" placeholder="e.g. Farnborough (FAB)"></div><div><label>Nearest international airport</label><input name="apComm" value="${esc(data.apComm||'')}" placeholder="e.g. London Heathrow (LHR)"></div></div>
      <div><label>Turnkey inclusions</label><textarea name="incl" placeholder="Furniture, art, vehicles, staff contracts, management agreement…">${esc(data.incl||'')}</textarea></div>
      <div class="drop">+ Drag photography here<br><small>Minimum 20 professional images · floor plans · drone (optional)</small></div>
      <div style="display:flex;justify-content:flex-end"><button class="btn btn-dark">Continue</button></div></form>`,
    () => `<form class="form" id="f">
      <div class="two"><div><label>Valuation firm</label><select name="valBy">${['Knight Frank Valuation & Advisory','Savills Valuation','CBRE Valuation','JLL Valuation Advisory','Cushman & Wakefield Valuation','Other approved firm'].map(t=>`<option ${data.valBy===t?'selected':''}>${t}</option>`).join('')}</select></div><div><label>Valuation amount (USD)</label><input name="valuation" type="number" required value="${data.valuation||''}"></div></div>
      <div class="two"><div><label>Valuation date</label><input name="valDate" type="date" required value="${data.valDate||''}"></div><div><label>Tenure</label><select name="tenure"><option>Freehold</option><option>Leasehold</option><option>Company / SPV</option></select></div></div>
      <div class="drop"><b>Upload valuation report (PDF)</b>We verify the report directly with the issuing firm.</div>
      <div class="drop"><b>Upload title / ownership evidence</b>Land registry extract, deed, or SPV share register.</div>
      <div class="drop"><b>Upload furnishing inventory</b>Spreadsheet or PDF; template available.</div>
      <div style="display:flex;justify-content:space-between"><button type="button" class="btn btn-outline" id="back">Back</button><button class="btn btn-dark">Continue</button></div></form>`,
    () => `<form class="form" id="f">
      <p class="muted">${state.listings.length ? `As an existing publisher (${esc(U.tier)}, vetted since ${longDate(U.memberSince)}) your identity checks are current.` : 'Identity, PEP and sanctions screening is carried out once, on your first application.'} Confirm ownership details for this residence.</p>
      <div class="two"><div><label>Owning entity</label><input name="entity" required value="${esc(data.entity||'')}" placeholder="Individual, trust or company name"></div><div><label>Jurisdiction of entity</label><input name="juris" required value="${esc(data.juris||'')}"></div></div>
      <div><label>Beneficial owner(s)</label><input name="ubo" required value="${esc(data.ubo||U.name)}"></div>
      <div><label>Confirmations</label>
        <div style="display:grid;gap:8px;font-size:14px;text-transform:none;letter-spacing:0;color:var(--text)">
          <label class="chk"><input type="checkbox" required style="width:auto"> I hold clear, marketable title and the right to sell.</label>
          <label class="chk"><input type="checkbox" required style="width:auto"> The residence will host investor residencies, for which I earn one night per night hosted.</label>
          <label class="chk"><input type="checkbox" required style="width:auto"> I agree to the 0.5% seller-side commission on completion and 90-day exclusivity on the exchange.</label>
        </div></div>
      <div style="display:flex;justify-content:space-between"><button type="button" class="btn btn-outline" id="back">Back</button><button class="btn btn-dark">Continue</button></div></form>`,
    () => { const diff = data.valuation ? ((data.price-data.valuation)/data.valuation*100) : 0; return `
      <h3 style="margin-bottom:14px">Review &amp; submit</h3>
      <table class="table">
        <tr><td>Residence</td><td><b>${esc(data.name)}</b> · ${esc(data.type)} · ${esc(data.city)}, ${esc(data.country)}</td></tr>
        <tr><td>Asking</td><td>${fmt(data.price)} <span class="muted">(${diff>0?'+':''}${diff.toFixed(1)}% vs valuation)</span></td></tr>
        <tr><td>Valuation</td><td>${fmt(data.valuation)} · ${esc(data.valBy)} · ${data.valDate?longDate(data.valDate):''}</td></tr>
        <tr><td>Specification</td><td>${data.beds} beds · ${data.baths} baths · ${Number(data.sqm).toLocaleString()} m²</td></tr>
        <tr><td>Arrival</td><td>${esc(data.apPriv||'—')} · ${esc(data.apComm||'—')}</td></tr>
        <tr><td>Owner</td><td>${esc(data.entity)} (${esc(data.juris)}) · UBO ${esc(data.ubo)}</td></tr>
        <tr><td>On approval</td><td><b>+7 nights</b> · +1 night per night hosted · visible to vetted investors · 0.5% seller-side commission on completion (${fmt(data.price*0.005)})</td></tr>
      </table>
      ${Math.abs(diff)>15?'<p style="color:var(--red);margin-top:12px">Asking price exceeds valuation by more than 15% — the publishing desk will contact you before approval.</p>':''}
      <div style="display:flex;justify-content:space-between;margin-top:22px"><button type="button" class="btn btn-outline" id="back">Back</button><button class="btn btn-gold" id="submit">Submit application</button></div>`; },
  ];
  const show = () => {
    app.innerHTML = wrap(); box().innerHTML = forms[step]();
    const f = $('#f'); if (f) f.onsubmit = e => { e.preventDefault(); new FormData(f).forEach((v,k)=> data[k] = ['price','sqm','beds','baths','valuation'].includes(k)? +v : v); step++; show(); };
    const b = $('#back'); if (b) b.onclick = () => { step--; show(); };
    const s = $('#submit'); if (s) s.onclick = () => {
      state.submissions.push({ ...data, id:'L'+Date.now().toString(36).toUpperCase(), date: ymd(today()), status:'In review' });
      save(); toast('Application received — 7 nights will be credited on approval'); navigate('#/dashboard');
    };
    window.scrollTo({top:0});
  };
  show();
}

/* ── ACCOUNT: sign in / create account ─────────────────────────── */
function authShell(inner){
  const p = byId('r44') || PROPS[0];
  return `<section class="auth"><div class="auth-img" style="background-image:url('${p.hero}')"><div class="cap"><b>${esc(p.name)}</b><span>${esc(p.city)} · ${fmtM(p.price)}</span></div></div><div class="auth-panel"><div class="auth-box">${inner}</div></div></section>`;
}
function viewLogin({ query }){
  if (user()) return navigate(query.next || '#/dashboard');
  app.innerHTML = authShell(`
    <span class="eyebrow">Sojourn Exchange</span>
    <h1 style="font-size:40px;margin:8px 0 6px">Sign in</h1>
    <p class="muted" style="margin-bottom:22px">For principals, family offices, property funds and financial institutions.</p>
    <form class="form" id="loginForm">
      <div><label>Email</label><input name="email" type="email" required autocomplete="username" placeholder="you@familyoffice.com"></div>
      <div><label>Password</label><input name="pw" type="password" required autocomplete="current-password"></div>
      <p class="err hidden" id="loginErr"></p>
      <button class="btn btn-dark btn-block">Sign in</button>
    </form>
    <p class="note" style="margin-top:18px">No account? <a href="#/signup${query.next?'?next='+encodeURIComponent(query.next):''}" style="color:var(--gold-2);font-weight:600">Create one</a> — then apply to publish a residence.</p>
    <p class="note" style="margin-top:6px;opacity:.7">Demo credentials: phillip.dimitrov@gmail.com · test1234</p>`);
  $('#loginForm').onsubmit = e => {
    e.preventDefault(); const f = new FormData(e.target);
    if (login(f.get('email'), f.get('pw'))) { toast(`Welcome back, ${user().name.split(' ')[0]}`); navigate(query.next || '#/dashboard'); }
    else { const el = $('#loginErr'); el.textContent = 'That email and password do not match an account.'; el.classList.remove('hidden'); }
  };
}
function viewSignup({ query }){
  if (user()) return navigate(query.next || '#/dashboard');
  app.innerHTML = authShell(`
    <span class="eyebrow">Sojourn Exchange</span>
    <h1 style="font-size:40px;margin:8px 0 6px">Create an account</h1>
    <p class="muted" style="margin-bottom:22px">An account takes a minute and lets you view and shortlist every residence. Listing a property is where the stringent vetting happens — and once a listing is approved, you reserve stays with your nights.</p>
    <form class="form" id="signupForm">
      <div class="two"><div><label>Full name</label><input name="name" required placeholder="Name as on passport"></div><div><label>Acting as</label><select name="entity"><option>Private investor</option><option>Family office</option><option>Property fund</option><option>Financial institution</option><option>Trustee</option><option>Adviser / private bank</option><option>Developer</option></select></div></div>
      <div><label>Email</label><input name="email" type="email" required autocomplete="username"></div>
      <div class="two"><div><label>Password</label><input name="pw" type="password" required minlength="8" autocomplete="new-password"></div><div><label>Confirm password</label><input name="pw2" type="password" required minlength="8" autocomplete="new-password"></div></div>
      <label class="chk"><input type="checkbox" required style="width:auto"> I understand that publishing or transacting requires identity, source-of-wealth and ownership vetting.</label>
      <p class="err hidden" id="signupErr"></p>
      <button class="btn btn-gold btn-block">Create account</button>
    </form>
    <p class="note" style="margin-top:18px">Already have one? <a href="#/login" style="color:var(--gold-2);font-weight:600">Sign in</a></p>`);
  $('#signupForm').onsubmit = e => {
    e.preventDefault(); const f = new FormData(e.target); const el = $('#signupErr');
    if (f.get('pw') !== f.get('pw2')) { el.textContent = 'Passwords do not match.'; el.classList.remove('hidden'); return; }
    const err = register({ name:f.get('name'), email:f.get('email'), pw:f.get('pw'), entity:f.get('entity') });
    if (err) { el.textContent = err; el.classList.remove('hidden'); return; }
    login(f.get('email'), f.get('pw')); toast('Account created — welcome to the exchange'); navigate(query.next || '#/dashboard');
  };
}

/* ── DASHBOARD ──────────────────────────────────────────────────── */
function viewDashboard(){
  if (!requireAuth('#/dashboard')) return;
  const U = user();
  const upcoming = state.stays.slice().sort((a,b)=>a.from.localeCompare(b.from));
  const earned = state.creditsIssued + state.creditsHosted;
  const used = earned - state.credits;
  const myListings = state.listings.map(byId).filter(Boolean);
  const stayHTML = s => { const p = byId(s.pid); return `<div class="list-item"><img src="${p.thumb}"><div class="t"><b>${esc(p.name)}</b><span>${shortDate(s.from)} → ${shortDate(s.to)} · ${s.nights} night${s.nights===1?'':'s'} · ${esc(p.airports.private.code)} ${esc(p.airports.private.label)} · <em>${s.status}</em></span></div><button class="btn btn-outline btn-sm" data-cancel="${s.id}">Cancel</button></div>`; };
  const GUESTS = ['Family office, Singapore','Private investor, Geneva','Family office, Dubai','Private investor, New York','Family trust, Hong Kong','Private investor, São Paulo'];
  app.innerHTML = `<section class="section"><div class="wrap">
    <div class="browse-head">
      <div><span class="eyebrow">Portfolio desk</span><h2>${esc(U.name.split(' ')[0])}'s exchange</h2><p class="muted">${esc(U.tier)} · ${esc(U.entity||'Private investor')} · vetted since ${longDate(U.memberSince)} · <span class="badge green">Verified</span></p></div>
      <div class="pill-row"><a class="btn btn-gold" href="#/browse">Acquire — reserve a residency</a><a class="btn btn-outline" href="#/apply">List your property</a></div>
    </div>
    <div class="dash-grid">
      <div class="panel">
        <h3>Nights ${icon('moon')}</h3>
        <div class="kpi">${state.credits}<span style="font-size:18px;color:var(--stone)"> / ${earned}</span></div>
        <div class="credits-viz">${Array.from({length: Math.min(earned, 60)}, (_,i)=>`<i class="${i < used ? 'used':''}"></i>`).join('')}</div>
        <p class="muted" style="font-size:13px"><b>${state.creditsIssued}</b> issued for ${state.listings.length} published residence${state.listings.length===1?'':'s'} · <b>+${state.creditsHosted}</b> earned by hosting · ${used} used across ${state.stays.length} residenc${state.stays.length===1?'y':'ies'}. Nights never expire while a residence is live.</p>
        ${state.credits===0?`<p style="margin-top:10px;font-size:13px"><a href="#/apply" style="color:var(--gold-2);font-weight:600">${state.listings.length?'Publish another residence':'Apply to publish a residence'} →</a> ${state.listings.length?'for 7 more, or host buyers.':'to receive your first seven nights.'}</p>`:''}
      </div>
      <div class="panel" style="grid-column:span 2">
        <h3>Buyer residencies hosted <span class="muted" style="font-size:13px;font-weight:500">Every buyer-night hosted = +1 night for you</span></h3>
        ${state.hosted.length ? state.hosted.slice().reverse().map(h=>{const p=byId(h.pid);return `<div class="list-item"><img src="${p.thumb}"><div class="t"><b>${esc(h.guest)}</b><span>${esc(p.name)} · ${shortDate(h.from)} → ${shortDate(h.to)} · ${h.nights} nights hosted · <span class="badge green">+${h.nights} nights</span></span></div></div>`;}).join('') : '<div class="empty">No investor residencies hosted yet. Confirmed stays at your residence appear here and credit your balance on departure.</div>'}
        ${state.listings.length?`<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px"><button class="btn btn-outline btn-sm" id="simHost">Simulate: an investor completes a stay at your residence</button></div>`:''}
      </div>
      <div class="panel" style="grid-column:span 2">
        <h3>Acquisition diligence · upcoming residencies <a class="btn btn-outline btn-sm" href="#/browse">Reserve</a></h3>
        ${upcoming.length ? upcoming.map(stayHTML).join('') : '<div class="empty">No residencies yet. Choose a residence, pick dates on its calendar, and use your nights.</div>'}
      </div>
      <div class="panel">
        <h3>Offers</h3>
        ${state.offers.length ? state.offers.map(o=>{const p=byId(o.pid);return `<div class="list-item"><div class="t"><b>${esc(p.name)}</b><span>${fmt(o.price)} · ${shortDate(o.date)} · buyer-side 0.5% ${fmt(o.price*0.005)} · <span class="badge">${o.status}</span></span></div></div>`;}).join('') : '<div class="empty">No offers in progress.</div>'}
      </div>
      <div class="panel" style="grid-column:1/-1">
        <h3>Properties listed <a class="btn btn-outline btn-sm" href="#/apply">Publish another</a></h3>
        ${!myListings.length && !state.submissions.length ? '<div class="empty">No properties listed yet. List one to receive your first seven nights.</div>' : ''}
        ${myListings.map(p=>`<div class="list-item"><img src="${p.thumb}"><div class="t"><b>${esc(p.name)}</b><span>${esc(p.city)} · asking ${fmtM(p.price)} · valued ${fmtM(p.valuation)} · <span class="badge green">Live</span> · ${40+hash(p.id)%120} investor views · ${hostedNightsFor(p.id)} nights booked next 6 months</span></div><a class="btn btn-outline btn-sm" href="#/property/${p.id}">Calendar</a></div>`).join('')}
        ${state.submissions.map(s=>`<div class="list-item"><div style="width:76px;height:56px;border-radius:10px;background:var(--sand)"></div><div class="t"><b>${esc(s.name)}</b><span>${esc(s.city)}, ${esc(s.country)} · asking ${fmt(s.price)} · <span class="badge">${s.status}</span> · submitted ${shortDate(s.date)}</span></div>${s.status==='In review'?`<button class="btn btn-outline btn-sm" data-approve="${s.id}">Simulate approval</button>`:''}</div>`).join('')}
      </div>
      <div class="panel" style="grid-column:1/-1">
        <h3>Shortlist</h3>
        ${state.watchlist.length ? `<div class="grid">${state.watchlist.map(byId).filter(Boolean).map(card).join('')}</div>` : '<div class="empty">Save residences with ♡ to compare them here.</div>'}
      </div>
      <div class="panel" style="grid-column:1/-1">
        <h3>Activity</h3>
        <ul class="timeline">
          ${state.offers.slice().reverse().map(o=>`<li>Offer of ${fmt(o.price)} submitted on ${esc(byId(o.pid).name)} · ${longDate(o.date)}</li>`).join('')}
          ${state.hosted.slice().reverse().map(h=>`<li>+${h.nights} nights earned — hosted ${esc(h.guest)} at ${esc(byId(h.pid).name)} (${shortDate(h.from)}–${shortDate(h.to)})</li>`).join('')}
          ${state.stays.slice().reverse().map(s=>`<li>Reserved ${s.nights} night${s.nights===1?'':'s'} at ${esc(byId(s.pid).name)} (${shortDate(s.from)}–${shortDate(s.to)}) · ${longDate(s.created)}</li>`).join('')}
          ${state.submissions.slice().reverse().map(s=>`<li>Application to publish: ${esc(s.name)} · ${longDate(s.date)}${s.status==='Approved'?' · approved, +7 nights':''}</li>`).join('')}
          ${state.listings.includes('r12')?`<li>7 nights issued — ${esc(byId('r12').name)} approved for publication · 02 May 2026</li>`:''}
          <li>Principal vetting complete (${esc(U.tier)}) · ${longDate(U.memberSince)}</li>
        </ul>
      </div>
    </div>
    <p class="note" style="margin-top:30px"><button id="reset" style="color:var(--stone);text-decoration:underline">Reset demo data</button> · <button id="logoutBtn" style="color:var(--stone);text-decoration:underline">Sign out</button></p>
  </div></section>`;
  bindFavs();
  $$('[data-cancel]').forEach(b => b.onclick = () => { const i = state.stays.findIndex(s=>s.id===b.dataset.cancel); if (i>-1){ state.credits += state.stays[i].nights; state.stays.splice(i,1); save(); toast('Residency cancelled — nights returned'); render(); } });
  $$('[data-approve]').forEach(b => b.onclick = () => { const i = state.submissions.findIndex(s=>s.id===b.dataset.approve); if (i>-1){ state.submissions[i].status='Approved'; state.credits += 7; state.creditsIssued += 7; save(); toast('Residence approved — 7 nights credited'); render(); } });
  const sh = $('#simHost'); if (sh) sh.onclick = () => {
    const pid = state.listings[0] || 'r12'; const r = rng(Date.now()>>>0);
    const nights = 2 + Math.floor(r()*5); const from = addDays(today(), -Math.floor(r()*30)-nights);
    state.hosted.push({ pid, from: ymd(from), to: ymd(addDays(from, nights)), nights, guest: GUESTS[Math.floor(r()*GUESTS.length)] });
    state.credits += nights; state.creditsHosted += nights; save(); toast(`Investor departed — +${nights} nights credited to your balance`); render();
  };
  $('#reset').onclick = () => { localStorage.removeItem(storeKey()); state = defaultState(); save(); toast('Demo data reset'); render(); };
  $('#logoutBtn').onclick = logout;
}

/* ── boot ───────────────────────────────────────────────────────── */
const boot = d => {
  PROPS = d; seedAccounts();
  const se = sessionEmail(); if (se && accounts()[se]) currentUser = se;
  state = load(); renderNavBits(); render();
  $('#navAvatar').onclick = e => { e.preventDefault(); const m = $('#avatarMenu'); m.classList.toggle('hidden'); };
  $('#menuLogout').onclick = e => { e.preventDefault(); $('#avatarMenu').classList.add('hidden'); logout(); };
  document.addEventListener('click', e => { if (!e.target.closest('.avatar-wrap')) $('#avatarMenu')?.classList.add('hidden'); });
};
if (window.SOJOURN_DATA) boot(window.SOJOURN_DATA);
else fetch('data/properties.json').then(r => r.json()).then(boot)
  .catch(() => { app.innerHTML = '<div class="wrap section"><div class="empty">Could not load data/properties.json — serve this folder over HTTP (e.g. <code>python3 -m http.server 8080</code>).</div></div>'; });
})();
