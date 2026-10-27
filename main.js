'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- DANE ---------- */
const PLACES = {
  ilford:  { city: 'Ilford', church: "St. Cedd's Church", addr: 'High Road, Ilford IG3 8SH', q: "St Cedd's Church High Road Ilford IG3 8SH" },
  wc:      { city: 'Waltham Cross', church: 'Our Lady of the Immaculate Conception & St Joseph', addr: '204 High Street, EN8 7DP', q: '204 High Street Waltham Cross EN8 7DP' },
  southend:{ city: 'Southend-on-Sea', church: 'Sacred Heart Church', addr: '418 Southchurch Rd, SS1 2QB', q: '418 Southchurch Rd Southend on Sea SS1 2QB' }
};
// d: 0 = niedziela ... 6 = sobota (jak w JS Date)
const MASSES = [
  { d: 0, t: '07:30', p: 'ilford' }, { d: 0, t: '09:45', p: 'wc' }, { d: 0, t: '13:00', p: 'ilford' }, { d: 0, t: '18:00', p: 'southend' },
  { d: 2, t: '19:00', p: 'wc' },
  { d: 3, t: '19:00', p: 'ilford' }, { d: 4, t: '19:00', p: 'ilford' }, { d: 5, t: '19:00', p: 'ilford' },
  { d: 6, t: '18:30', p: 'ilford' }
];
const DAYS_PL = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
const DAYS_SHORT = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];
const DAYS_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const mapsLink = p => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(PLACES[p].q);

/* ---------- CZAS LONDYŃSKI ---------- */
function londonNow() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: false, weekday: 'short' }).formatToParts(new Date());
  const g = t => parts.find(p => p.type === t).value;
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday'));
  return { y: +g('year'), m: +g('month'), d: +g('day'), h: +g('hour') % 24, min: +g('minute'), wd };
}
// Kolejne wystąpienia Mszy (do 8 dni naprzód) jako "minuty od teraz"
function upcoming() {
  const n = londonNow(), nowMin = n.h * 60 + n.min, out = [];
  for (let off = 0; off < 8; off++) {
    const wd = (n.wd + off) % 7;
    MASSES.filter(m => m.d === wd).forEach(m => {
      const [h, mi] = m.t.split(':').map(Number);
      const diff = off * 1440 + h * 60 + mi - nowMin;
      if (diff > -60) out.push({ ...m, diff, off }); // trwająca Msza liczy się przez godzinę
    });
  }
  return out.sort((a, b) => a.diff - b.diff);
}
function whenText(x) {
  if (x.diff <= 0) return 'Trwa właśnie teraz';
  if (x.diff < 60) return `Zaczyna się za ${x.diff} min`;
  const n = londonNow();
  if (x.off === 0) return `Dziś, za ${Math.floor(x.diff / 60)} godz. ${x.diff % 60} min`;
  if (x.off === 1) return 'Jutro';
  return DAYS_PL[x.d] === 'Niedziela' ? 'W niedzielę' : 'W ' + ({ Wtorek: 'wtorek', Środa: 'środę', Czwartek: 'czwartek', Piątek: 'piątek', Sobota: 'sobotę' })[DAYS_PL[x.d]];
}

/* ---------- RÓŻA ---------- */
(function rose() {
  const svg = $('#rose'); if (!svg) return;
  const C = ['#b3263e', '#2a56c6', '#e0a43a', '#1f8f6b', '#7a3fb0', '#d9622b'];
  const NS = 'http://www.w3.org/2000/svg';
  let h = `<defs>
    <radialGradient id="rg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff6d6"/><stop offset="1" stop-color="#e0b96e"/></radialGradient>
    <filter id="soft"><feGaussianBlur stdDeviation=".35"/></filter></defs>`;
  h += `<circle r="97" fill="#fff8e6" stroke="#a97b1f" stroke-width="1.4"/><circle r="93" fill="none" stroke="#a97b1f" stroke-opacity=".55" stroke-width=".4"/>`;
  // zewnętrzny pierścień: 24 małe okienka
  for (let i = 0; i < 24; i++) {
    h += `<g transform="rotate(${i * 15})"><path d="M0,-91 C4.5,-88 4.5,-80 0,-77 C-4.5,-80 -4.5,-88 0,-91Z" fill="${C[i % 6]}" fill-opacity=".88" stroke="#8a6720" stroke-width=".5"/></g>`;
  }
  // 12 dużych lancetów
  for (let i = 0; i < 12; i++) {
    h += `<g transform="rotate(${i * 30})">
      <path d="M0,-30 C15,-42 15,-64 0,-74 C-15,-64 -15,-42 0,-30Z" fill="${C[i % 6]}" fill-opacity=".84" stroke="#8a6720" stroke-width=".8"/>
      <path d="M0,-36 C8,-44 8,-60 0,-67 C-8,-60 -8,-44 0,-36Z" fill="${C[(i + 3) % 6]}" fill-opacity=".6"/>
      <path d="M0,-58 L2.2,-54 L0,-50 L-2.2,-54Z" fill="#fff6d6" fill-opacity=".8"/></g>`;
  }
  // wewnętrzne płatki
  for (let i = 0; i < 8; i++) {
    h += `<g transform="rotate(${i * 45 + 22.5})"><path d="M0,-10 C8,-16 8,-26 0,-30 C-8,-26 -8,-16 0,-10Z" fill="${C[(i + 1) % 6]}" fill-opacity=".88" stroke="#8a6720" stroke-width=".5"/></g>`;
  }
  h += `<circle r="12" fill="#fff8e6" stroke="#8a6720" stroke-width=".9"/><circle r="8.5" fill="url(#rg)"/>
    <path d="M0-6V6M-6 0H6" stroke="#7a5a1a" stroke-width="1.6" stroke-linecap="round"/>`;
  // szprychy
  for (let i = 0; i < 12; i++) h += `<line x1="0" y1="-12" x2="0" y2="-93" transform="rotate(${i * 30 + 15})" stroke="#8a6720" stroke-opacity=".4" stroke-width=".4"/>`;
  svg.innerHTML = h;
})();

/* ---------- KOLOR LITURGICZNY ---------- */
(function liturgy() {
  const n = londonNow(), Y = n.y;
  // Wielkanoc (algorytm Meeusa/Jonesa/Butchera)
  const a = Y % 19, b = Math.floor(Y / 100), c = Y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const hh = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - hh - k) % 7, m = Math.floor((a + 11 * hh + 22 * l) / 451);
  const mo = Math.floor((hh + l - 7 * m + 114) / 31), da = ((hh + l - 7 * m + 114) % 31) + 1;
  const day = (y, mm, dd) => Date.UTC(y, mm - 1, dd) / 864e5;
  const easter = day(Y, mo, da), today = day(n.y, n.m, n.d);
  const xmas = day(Y, 12, 25), dow = new Date(Date.UTC(Y, 11, 25)).getUTCDay();
  const advent = xmas - (dow === 0 ? 7 : dow) - 21;
  let name = 'Okres zwykły', col = '#3fae82';
  if (today >= easter - 46 && today < easter - 7) { name = 'Wielki Post'; col = '#8f5bd1'; }
  else if (today >= easter - 7 && today < easter - 1) { name = 'Wielki Tydzień'; col = '#c0354c'; }
  else if (today >= easter - 1 && today <= easter + 49) { name = today <= easter + 49 && today >= easter ? 'Okres wielkanocny' : 'Triduum'; col = '#f4dba3'; }
  else if (today >= advent && today < xmas) { name = 'Adwent'; col = '#8f5bd1'; }
  else if (today >= xmas || today <= day(Y, 1, 13)) { name = 'Boże Narodzenie'; col = '#f4dba3'; }
  document.documentElement.style.setProperty('--lit', col);
  $('#seasonText').textContent = name;
})();

/* ---------- NAJBLIŻSZA MSZA (hero) ---------- */
function renderNext() {
  const x = upcoming()[0]; if (!x) return;
  const p = PLACES[x.p];
  $('#nmTime').textContent = x.t.replace(/^0/, '');
  $('#nmWhen').textContent = whenText(x);
  $('#nmPlace').textContent = `${p.city} · ${p.church}`;
  $('#nmLabel').textContent = x.diff <= 0 ? 'Msza trwa' : 'Najbliższa Msza święta';
}
renderNext(); setInterval(renderNext, 30000);
$('#massCount').dataset.count = MASSES.length;

/* ---------- WYBÓR DNIA ---------- */
(function schedule() {
  const box = $('#days'), panel = $('#dayPanel'); if (!box) return;
  const n = londonNow(), order = [1, 2, 3, 4, 5, 6, 0];
  box.innerHTML = order.map(d => {
    const has = MASSES.some(m => m.d === d);
    return `<button class="day${has ? ' has' : ''}${d === n.wd ? ' today' : ''}" data-d="${d}" role="tab"><small>${DAYS_EN[d]}</small><b>${DAYS_PL[d]}</b><i class="dot"></i></button>`;
  }).join('');
  function ics(m) {
    const now = londonNow(); let off = (m.d - now.wd + 7) % 7;
    const dt = new Date(Date.UTC(now.y, now.m - 1, now.d + off));
    const ds = dt.getUTCFullYear() + String(dt.getUTCMonth() + 1).padStart(2, '0') + String(dt.getUTCDate()).padStart(2, '0');
    const t = m.t.replace(':', '') + '00', p = PLACES[m.p];
    const txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PMK Ilford//PL', 'BEGIN:VEVENT', `UID:${m.d}${m.t}${m.p}@pmk-ilford`, `DTSTAMP:${ds}T000000Z`,
      `DTSTART;TZID=Europe/London:${ds}T${t}`, 'DURATION:PT1H', 'RRULE:FREQ=WEEKLY', 'SUMMARY:Msza święta po polsku', `LOCATION:${p.church}\\, ${p.addr}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/calendar' }));
    a.download = `msza-${m.p}-${DAYS_SHORT[m.d]}.ics`; a.click(); toast('Dodano plik do kalendarza');
  }
  function show(d) {
    $$('.day', box).forEach(b => { const on = +b.dataset.d === d; b.classList.toggle('on', on); b.setAttribute('aria-selected', on) });
    const list = MASSES.filter(m => m.d === d).sort((a, b) => a.t.localeCompare(b.t));
    if (!list.length) {
      const nx = upcoming().find(x => x.diff > 0);
      panel.innerHTML = `<div class="empty"><b>${DAYS_PL[d]}: bez Mszy</b>${nx ? `Najbliższa Msza: ${DAYS_PL[nx.d].toLowerCase()}, ${nx.t.replace(/^0/, '')}, ${PLACES[nx.p].city}.` : ''} Pamiętaj, że kancelaria działa po wcześniejszym telefonie.</div>`; return;
    }
    panel.innerHTML = list.map((m, i) => { const p = PLACES[m.p]; return `
      <div class="mass" style="animation-delay:${i * 80}ms">
        <time>${m.t.replace(/^0/, '')}</time>
        <div><h3>${p.city}</h3><p>${p.church}<br>${p.addr}</p></div>
        <div class="mass-actions"><a class="chip" href="${mapsLink(m.p)}" target="_blank" rel="noopener">Nawiguj</a><button class="chip" data-ics="${MASSES.indexOf(m)}">Dodaj do kalendarza</button></div>
      </div>`; }).join('');
  }
  box.addEventListener('click', e => { const b = e.target.closest('.day'); if (b) show(+b.dataset.d); });
  panel.addEventListener('click', e => { const b = e.target.closest('[data-ics]'); if (b) ics(MASSES[+b.dataset.ics]); });
  show(n.wd);
})();


/* ---------- MSZE: PRZEŁĄCZNIK KALENDARZ / WSPÓLNOTY ---------- */
(function views() {
  const seg = $('#viewSeg'), cal = $('#viewCal'), pl = $('#viewPlaces'), cols = $('#pcols'); if (!seg) return;
  const order = [1, 2, 3, 4, 5, 6, 0], today = londonNow().wd;
  cols.innerHTML = Object.entries(PLACES).map(([k, p], i) => {
    const rows = order.map(d => {
      const t = MASSES.filter(m => m.d === d && m.p === k).map(m => m.t).sort().map(x => x.replace(/^0/, ''));
      return `<li class="${d === today ? 'today' : ''}${t.length ? '' : ' off'}"><span class="dn">${DAYS_PL[d]}</span><span class="tm">${t.length ? t.join(' · ') : '—'}</span></li>`;
    }).join('');
    return `<article class="pcol" style="animation-delay:${i * 90}ms"><div class="pcol-head"><h3>${p.city}</h3><p class="church">${p.church}</p><p class="addr">${p.addr}</p></div><ul class="sched">${rows}</ul><a class="chip" href="${mapsLink(k)}" target="_blank" rel="noopener">Nawiguj</a></article>`;
  }).join('');
  seg.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', seg).forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); });
    const v = b.dataset.view; cal.hidden = v !== 'cal'; pl.hidden = v !== 'places';
  });
})();

/* ---------- AKTUALNOŚCI (data/aktualnosci.json) ---------- */
(function news() {
  const box = $('#newsList'); if (!box) return;
  const MON = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toDay = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d) / 864e5; };
  const n = londonNow(), today = Date.UTC(n.y, n.m - 1, n.d) / 864e5;
  const weekEnd = today + ((7 - n.wd) % 7); // najbliższa niedziela
  const parts = s => { const [y, m, d] = s.split('-').map(Number); return { d, m: MON[m - 1] }; };
  function dateBlock(e) {
    if (!e.dataOd) return '<div class="nd nodate" aria-hidden="true">✦</div>';
    const a = parts(e.dataOd);
    if (!e.dataDo || e.dataDo === e.dataOd) return `<div class="nd"><b>${a.d}</b><span>${a.m}</span></div>`;
    const z = parts(e.dataDo);
    return a.m === z.m ? `<div class="nd"><b class="rng">${a.d}–${z.d}</b><span>${a.m}</span></div>` : `<div class="nd"><b class="rng">${a.d} ${a.m}</b><span>– ${z.d} ${z.m}</span></div>`;
  }
  function rel(e) {
    if (!e.dataOd) return '';
    const from = toDay(e.dataOd), to = toDay(e.dataDo || e.dataOd);
    if (today >= from && today <= to) return from === to ? '<span class="nrel now">Dziś</span>' : '<span class="nrel now">Trwa teraz</span>';
    const k = from - today; if (k === 1) return '<span class="nrel">Jutro</span>';
    return k > 1 && k <= 14 ? `<span class="nrel">Za ${k} dni</span>` : '';
  }
  function tile(e, i) {
    const t = e.typ === 'Wydarzenie' ? '' : e.typ === 'Ogłoszenie' ? ' t-og' : ' t-in';
    const meta = [e.godzina && `🕐 ${esc(e.godzina)}`, e.miejsce && `📍 ${esc(e.miejsce)}`].filter(Boolean).map(x => `<span>${x}</span>`).join('');
    const long = (e.tekst || '').length > 220;
    return `<article class="ntile${e.wyroznij ? ' featured' : ''}" style="animation-delay:${i * 80}ms">${dateBlock(e)}<div class="nbody">
      <div class="ntop"><span class="nchip${t}">${esc(e.typ || 'Informacja')}</span>${rel(e)}</div>
      <h3>${esc(e.tytul)}</h3>
      <p class="${long ? 'clamp' : ''}">${esc(e.tekst)}</p>${long ? '<button class="nmore">Czytaj więcej</button>' : ''}
      ${meta ? `<div class="nmeta">${meta}</div>` : ''}
      ${e.autor ? `<p class="nsign">— ${esc(e.autor)}</p>` : ''}</div></article>`;
  }
  function dateText(e) {
    if (!e.dataOd) return '';
    const f = parts(e.dataOd); if (!e.dataDo || e.dataDo === e.dataOd) return `${f.d} ${f.m}`;
    const z = parts(e.dataDo); return f.m === z.m ? `${f.d}–${z.d} ${f.m}` : `${f.d} ${f.m} – ${z.d} ${z.m}`;
  }
  // mały box w hero: pierwszy wpis z listy (najbliższy w czasie)
  function heroNews(e) {
    const hb = $('#hnBody'); if (!hb) return;
    if (!e) { hb.innerHTML = '<p class="hn-text">Brak bieżących ogłoszeń. Zajrzyj na Facebooka parafii.</p>'; return; }
    const t = e.typ === 'Wydarzenie' ? '' : e.typ === 'Ogłoszenie' ? ' t-og' : ' t-in';
    const when = [dateText(e), e.godzina, e.miejsce].filter(Boolean).map(esc).join(' · ');
    hb.innerHTML = `<div class="hn-top"><span class="nchip${t}">${esc(e.typ || 'Informacja')}</span>${rel(e)}</div><h3>${esc(e.tytul)}</h3>${when ? `<p class="hn-text">${when}</p>` : ''}`;
  }
  // Maksymalnie 5 kafelków widocznych naraz; reszta przewija się wewnątrz sekcji
  const LIMIT = 5, wrap = $('#newsWrap'), sc = $('#newsScroll'), more = $('#newsMore');
  function limitHeight() {
    const t = $$('.ntile', box)[LIMIT - 1];
    sc.style.maxHeight = (t.offsetTop + t.offsetHeight + 4) + 'px';
  }
  function fit() {
    const tiles = $$('.ntile', box);
    sc.style.maxHeight = '';
    wrap.classList.remove('scrolls', 'at-end'); more.hidden = true;
    if (tiles.length <= LIMIT) return;
    limitHeight();
    wrap.classList.add('scrolls');
    more.textContent = `Przewiń w dół, aby zobaczyć kolejne wpisy (jeszcze ${tiles.length - LIMIT})`; more.hidden = false;
    edge();
  }
  function edge() { wrap.classList.toggle('at-end', sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 4); }
  sc.addEventListener('scroll', edge, { passive: true });
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(fit, 150); });
  function render(list) {
    const vis = list.filter(e => e.tytul && toDay(e.widocznyDo || e.dataDo || e.dataOd || '2999-12-31') >= today)
      .sort((a, b) => (a.dataOd || '9999').localeCompare(b.dataOd || '9999'));
    heroNews(vis[0]);
    if (!vis.length) { box.innerHTML = '<div class="empty"><b>Brak aktualnych ogłoszeń</b>Zajrzyj na nasz profil na Facebooku albo wróć po niedzielnej Mszy.</div>'; return; }
    const groups = [
      ['W tym tygodniu', vis.filter(e => e.dataOd && toDay(e.dataOd) <= weekEnd)],
      ['Wkrótce', vis.filter(e => e.dataOd && toDay(e.dataOd) > weekEnd)],
      ['Ogłoszenia', vis.filter(e => !e.dataOd)]
    ].filter(g => g[1].length);
    let i = 0;
    box.innerHTML = groups.map(([name, items]) => `<div class="ngroup">${name}</div>${items.map(e => tile(e, i++)).join('')}`).join('');
    fit();
  }
  box.addEventListener('click', e => { const b = e.target.closest('.nmore'); if (!b) return; const p = b.previousElementSibling; const open = p.classList.toggle('clamp'); b.textContent = open ? 'Czytaj więcej' : 'Zwiń'; if (wrap.classList.contains('scrolls')) { sc.style.maxHeight = ''; requestAnimationFrame(() => { limitHeight(); edge(); }); } });
  fetch('data/aktualnosci.json', { cache: 'no-store' }).then(r => r.json()).then(d => render(d.wpisy || []))
    .catch(() => { heroNews(null); box.innerHTML = '<div class="empty"><b>Nie udało się wczytać aktualności</b>Odśwież stronę albo zajrzyj na nasz profil na Facebooku.</div>'; });
})();

/* ---------- SAKRAMENTY ---------- */
(function sacraments() {
  const S = [
    { t: 'Chrzest Święty', l: 'Początek życia w Kościele. Wszystkie sprawy załatwiasz w kancelarii parafialnej.', li: ['Waltham Cross: pierwsza sobota miesiąca, godz. 14:00.', 'Ilford: pierwsza niedziela miesiąca, na Mszy o 13:00 lub zaraz po niej.', 'Dziecko może być ochrzczone, jeśli rodzice należą do naszej wspólnoty. W innym przypadku potrzebna jest zgoda własnego proboszcza.', 'Chrzestny: ukończone 16 lat, ochrzczony i bierzmowany w Kościele katolickim.'] },
    { t: 'Komunia Święta', l: 'Pierwsza Komunia dzieci. Przygotowanie odbywa się razem z rodzicami.', li: ['Dziecko zna Znak Krzyża, Ojcze nasz, Zdrowaś Maryjo, Aniele Boży i Chwała Ojcu.', 'Na katechezy dzieci przychodzą w obecności jednego z rodziców.', 'Potrzebna jest metryka chrztu dziecka.', 'Terminy zapisów podajemy w ogłoszeniach parafialnych. Po kursie dostaniesz zaświadczenie na Komunię w Polsce.'] },
    { t: 'Spowiedź Święta', l: 'Możesz przyjść w każdej chwili, nie trzeba się umawiać.', li: ['Pół godziny przed każdą Mszą świętą lub po umówieniu z księdzem.', 'Pięć warunków dobrej spowiedzi: rachunek sumienia, żal za grzechy, mocne postanowienie poprawy, wyznanie grzechów, zadośćuczynienie Bogu i bliźnim.'] },
    { t: 'Bierzmowanie', l: 'Sakrament dojrzałości chrześcijańskiej, udzielany co dwa lata.', li: ['Minimalny wiek to 14 lat (wyjątki za zgodą duszpasterza).', 'Zapisy na katechezy u księży. Termin podajemy w ogłoszeniach.', 'Niepełnoletni uczestniczą w katechezach z jednym z rodziców.', 'Potrzebna metryka chrztu. Świadek to praktykujący katolik po bierzmowaniu.'] },
    { t: 'Małżeństwo', l: 'Zgłoś się do duszpasterza najpóźniej 3 miesiące przed ślubem.', li: ['Podaj dokładną datę ślubu, parafię i diecezję, w której będzie ślub, oraz dane świadków.', 'Dokumenty: dowód tożsamości, rozszerzona metryka chrztu (nie starsza niż 6 miesięcy), zaświadczenie o kursie przedmałżeńskim.', 'Przy ślubie w Polsce: zaświadczenie z USC (ważne 3 miesiące).'] }
  ];
  const tabs = $('#sacrTabs'), panel = $('#sacrPanel'); if (!tabs) return;
  tabs.innerHTML = S.map((s, i) => `<button class="stab" role="tab" data-i="${i}"><span>${['I', 'II', 'III', 'IV', 'V'][i]}</span>${s.t}</button>`).join('');
  const show = i => {
    $$('.stab', tabs).forEach((b, j) => b.classList.toggle('on', i === j));
    const s = S[i];
    panel.innerHTML = `<div class="sp-in"><h3>${s.t}</h3><p class="lede">${s.l}</p><ul>${s.li.map(x => `<li>${x}</li>`).join('')}</ul><a class="btn btn-gold" href="#kontakt">Skontaktuj się z kancelarią</a></div>`;
  };
  tabs.addEventListener('click', e => { const b = e.target.closest('.stab'); if (b) show(+b.dataset.i); });
  show(0);
})();

/* ---------- GALERIA ---------- */
const GALLERY = ['p320', 'p317', 'p277', 'p313', 'p311', 'p318', 'p316', 'p305', 'dom', 'p319', 'p312', 'p308', 'p279', 'p309'];
(function gallery() {
  const m = $('#masonry'); if (!m) return;
  m.innerHTML = GALLERY.map((g, i) => `<button data-i="${i}" aria-label="Powiększ zdjęcie ${i + 1}"><img src="assets/${g}.webp" alt="Zdjęcie z życia parafii" loading="lazy"></button>`).join('');
  const lb = $('#lb'), img = $('#lbImg'); let cur = 0;
  const open = i => { cur = (i + GALLERY.length) % GALLERY.length; img.src = `assets/${GALLERY[cur]}.webp`; lb.hidden = false; document.body.style.overflow = 'hidden'; };
  const close = () => { lb.hidden = true; document.body.style.overflow = ''; };
  m.addEventListener('click', e => { const b = e.target.closest('button'); if (b) open(+b.dataset.i); });
  lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-x')) close(); });
  $('.lb-prev').onclick = () => open(cur - 1); $('.lb-next').onclick = () => open(cur + 1);
  addEventListener('keydown', e => { if (lb.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') open(cur - 1); if (e.key === 'ArrowRight') open(cur + 1); });
  let sx = 0; lb.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
  lb.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) open(cur + (dx < 0 ? 1 : -1)); });
})();

/* ---------- MAPA ---------- */
(function map() {
  const tabs = $('#mapTabs'), fr = $('#mapFrame'); if (!tabs) return;
  tabs.innerHTML = Object.entries(PLACES).map(([k, p]) => `<button data-k="${k}">${p.city}</button>`).join('');
  const set = k => { $$('button', tabs).forEach(b => b.classList.toggle('on', b.dataset.k === k)); fr.src = 'https://www.google.com/maps?q=' + encodeURIComponent(PLACES[k].q) + '&output=embed'; };
  tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) set(b.dataset.k); });
  new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { set('ilford'); o.disconnect(); } }, { rootMargin: '300px' }).observe(fr);
})();

/* ---------- KOPIOWANIE NUMERÓW KONT ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-copy]'); if (!b) return;
  navigator.clipboard?.writeText(b.dataset.copy).then(() => toast('Skopiowano: ' + b.dataset.copy), () => toast('Nie udało się skopiować'));
});
let tt; function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 2200); }

/* ---------- MENU MOBILNE / NAV ---------- */
const burger = $('#burger'), links = $('#navLinks');
burger.addEventListener('click', () => { const o = links.classList.toggle('open'); burger.setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : ''; });
links.addEventListener('click', e => { if (e.target.tagName === 'A') { links.classList.remove('open'); burger.setAttribute('aria-expanded', false); document.body.style.overflow = ''; } });

/* ---------- ANIMACJE PRZY PRZEWIJANIU ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
$$('.reveal').forEach(el => io.observe(el));

// licznik
const cio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; cio.unobserve(e.target);
  const el = e.target, to = +el.dataset.count, t0 = performance.now();
  const step = t => { const k = Math.min(1, (t - t0) / 1600); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 4))); if (k < 1) requestAnimationFrame(step); };
  reduce ? el.textContent = to : requestAnimationFrame(step);
}), { threshold: .6 });
$$('[data-count]').forEach(el => cio.observe(el));

// pasek postępu, nav, paralaksa, słowa
let ticking = false;
const parallax = $$('[data-speed]');
function onScroll() {
  const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
  $('#progress').style.width = (y / h * 100) + '%';
  $('#nav').classList.toggle('solid', y > 60);
  if (!reduce) {
    parallax.forEach(im => { const r = im.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; im.style.transform = `translateY(${(r.top + r.height / 2 - innerHeight / 2) * -+im.dataset.speed}px)`; });
  }
  ticking = false;
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();

// hero: reakcja na kursor/palec
const hero = $('#hero'), roseWrap = $('#roseWrap');
if (!reduce) {
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    hero.style.setProperty('--mx', x * 100 + '%'); hero.style.setProperty('--my', y * 100 + '%');
    roseWrap.style.transform = `translate(${(x - .5) * -26}px,calc(-50% + ${(y - .5) * -26}px))`;
  });
  // delikatne przechylanie kart
  $$('.tilt').forEach(c => {
    c.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; const r = c.getBoundingClientRect(); c.style.transform = `rotateY(${((e.clientX - r.left) / r.width - .5) * 7}deg) rotateX(${((e.clientY - r.top) / r.height - .5) * -5}deg)`; });
    c.addEventListener('pointerleave', () => c.style.transform = '');
  });
}

// przeciąganie karuzeli myszką
(function drag() {
  const r = $('#rail'); if (!r) return; let down = false, sx = 0, sl = 0, moved = false;
  r.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = r.scrollLeft; });
  addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; r.classList.add('drag'); } r.scrollLeft = sl - dx; });
  addEventListener('pointerup', () => { down = false; r.classList.remove('drag'); });
})();

$('#year').textContent = new Date().getFullYear();
