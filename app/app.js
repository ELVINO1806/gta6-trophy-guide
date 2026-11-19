// Leonida Trophy Ledger — tracker + cited guide for the 55 GTA VI PS5 trophies.
// State lives in localStorage; shot mode (?shot=...) renders deterministic demo
// states for screenshots and never touches localStorage.
const KEY = 'leonida-trophy-ledger/v1';
const params = new URLSearchParams(location.search);
const shot = params.get('shot');

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));

const DEMO_EARNED = {
  checklist: [2, 3, 8, 15, 16, 21, 32, 36],
  guide: [2, 3, 8, 16, 21],
  roadmap: [2, 3, 8, 16],
  spoiler: [2, 16, 21],
};

let earned = new Set();
let spoiler = true;
if (shot) {
  earned = new Set(DEMO_EARNED[shot] ?? []);
} else {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    earned = new Set((saved.earned ?? []).filter((id) => byId.has(id)));
    spoiler = saved.spoiler !== false;
  } catch { /* fresh start */ }
}

const state = { kind: 'all', grade: 'all', query: '', view: shot === 'roadmap' ? 'roadmap' : 'checklist', selected: null };

const $ = (id) => document.getElementById(id);
const cardsEl = $('cards');

function save() {
  if (shot) return;
  localStorage.setItem(KEY, JSON.stringify({ earned: [...earned], spoiler }));
}

function isMasked(t) {
  return spoiler && !earned.has(t.id) && (t.hidden || t.kind === 'story');
}

function displayName(t) {
  if (!isMasked(t)) return t.name;
  return t.kind === 'story' ? 'Hidden — story trophy' : 'Hidden trophy';
}
function displayDesc(t) {
  if (!isMasked(t)) return t.description;
  return 'Hidden until you earn it. Turn spoiler protection off to reveal it now.';
}

function kindLabel(t) {
  return { story: 'Story', collectibles: 'Collectibles', activities: 'Activities', online: 'Online' }[t.kind] ?? t.kind;
}

function matches(t) {
  if (state.kind === 'story' && t.kind !== 'story') return false;
  if (state.kind === 'missable' && !t.missable) return false;
  if (state.kind === 'collectibles' && t.kind !== 'collectibles') return false;
  if (state.kind === 'activities' && t.kind !== 'activities') return false;
  if (state.kind === 'online' && t.kind !== 'online') return false;
  if (state.grade !== 'all' && t.grade !== state.grade) return false;
  if (state.query) {
    const q = state.query.toLowerCase();
    const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function tagRow(t) {
  const tags = [];
  tags.push(`<span class="tag">${kindLabel(t)}</span>`);
  if (t.hidden) tags.push('<span class="tag hid">Hidden</span>');
  if (t.missable) tags.push('<span class="tag miss">MISSABLE</span>');
  if (t.count != null) tags.push(`<span class="tag">Target ${t.count.toLocaleString('en-US')}</span>`);
  return tags.join('');
}

function renderCards() {
  const shown = trophies.filter(matches);
  cardsEl.replaceChildren();
  for (const t of shown) {
    const card = document.createElement('article');
    card.className = 'card' + (earned.has(t.id) ? ' earned' : '') + (isMasked(t) ? ' masked' : '');
    const top = document.createElement('div');
    top.className = 'card-top';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} earned`);
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id); else earned.delete(t.id);
      save(); render();
    });
    const h = document.createElement('h3');
    h.textContent = displayName(t);
    const badge = document.createElement('span');
    badge.className = `badge ${t.grade}`;
    badge.textContent = t.grade;
    top.append(box, h, badge);
    const desc = document.createElement('p');
    desc.className = 'desc';
    desc.textContent = displayDesc(t);
    const tags = document.createElement('div');
    tags.className = 'tags';
    tags.innerHTML = tagRow(t);
    card.append(top, desc, tags);
    card.addEventListener('click', () => openDetail(t.id));
    cardsEl.append(card);
  }
  const empty = $('emptyLine');
  if (shown.length === 0) {
    empty.hidden = false;
    empty.textContent = state.kind === 'online'
      ? 'No online trophies: the whole GTA VI list is single-player, as published by Exophase and PSNProfiles and confirmed by every launch guide. Nothing to track here.'
      : 'No trophies match the current filters.';
  } else {
    empty.hidden = true;
  }
  $('resultLine').textContent = `Showing ${shown.length} of 55 trophies`;
}

function renderProgress() {
  $('earnedCount').textContent = String(earned.size);
  $('barFill').style.width = `${(earned.size / trophies.length) * 100}%`;
  const per = (g) => `${earned.size ? trophies.filter((t) => t.grade === g && earned.has(t.id)).length : 0}/${trophies.filter((t) => t.grade === g).length}`;
  $('gradeLine').textContent = `Platinum ${per('platinum')} · Gold ${per('gold')} · Silver ${per('silver')} · Bronze ${per('bronze')}`;
  $('pctLine').textContent = `${Math.round((earned.size / trophies.length) * 100)}% of the list`;
}

const PHASES = [
  {
    title: 'Story first — and save at every chapter',
    body: 'Play the five chapters in order; every story trophy is hidden and unlocks as you go, from Gone Fishing to the final mission. GTA VI has no mission replay, so drop a manual save at the start of each chapter (you have 15 slots) and one more before the final mission. In Chapter 1, take Lucia\u2019s balcony meditation when it is offered — it belongs to the one possibly-missable trophy on the list.',
    ids: [2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 7],
  },
  {
    title: 'Stranger strands',
    body: 'Work the stranger strands as they open: Andy, Kenton, Billy, Randy and Tyrone each end in a final mission with its own hidden trophy, Bret sends you after a unique animal, and any 8 completed strands earn Strangers & Freaks. Strands also sit on the 100% checklist, so this time is never wasted.',
    ids: [22, 23, 24, 26, 27, 29, 25],
  },
  {
    title: 'Collections and the big map',
    body: 'Sweep Leonida once, thoroughly: meditate at all 18 spots, finish 3 collectible card sets, WAiNK It at 100 locations, discover 100 vehicles, visit all 52 areas, buy all 8 garages and register 10 vehicles on the Scooter Bros app. One long road trip with a checklist beats seven short ones.',
    ids: [28, 30, 31, 35, 42, 54, 55],
  },
  {
    title: 'Activities and the long grinds',
    body: 'Sample every activity once for Master of None, then settle into the counters: 250 stunts, gold in all 42 shooting range challenges, a drone race win at all 14 locations, 20 different race wins, a fishing win over Cal, one arcade game and 50 challenges. These are repeatable, so none of them can be missed — they are a time budget, not a risk.',
    ids: [16, 15, 17, 18, 19, 20, 21, 32],
  },
  {
    title: 'Money, robberies and partner moments',
    body: 'With the map open, chain the crime trophies: rob 5 bank vaults, an armored truck, a jewelry store without detection and one illegal operation per gang (9). Launder $250,000 of marked bills and spend $100,000 on the way. The partner trophies (Hot Together, Retail Therapy) and the hidden one-off secrets — the VCIA departure, the Rhino encounter, the Ocean Beach cocktail, the showroom exit, the bowling follow-through and the rest — are picked up in joint free-roam time with Jason and Lucia.',
    ids: [40, 41, 39, 43, 52, 53, 33, 34, 36, 37, 38, 44, 45, 46, 47, 48, 49, 50, 51],
  },
  {
    title: '100% completion — then the platinum',
    body: 'After the story, the full checklist appears at Progress > Stats > 100% Completion; everything you already did counts, and GTABase reports nothing on the checklist itself is missable. Close out whatever strands, sets and counters remain for A Long Road — guides estimate the whole run at roughly 200 hours — and Vice Got a Price! pops on its own the moment the other 54 are done.',
    ids: [14, 1],
  },
];

function renderRoadmap() {
  const wrap = $('phases');
  wrap.replaceChildren();
  PHASES.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'phase';
    const names = p.ids.map((id) => {
      const t = byId.get(id);
      return `<span class="tag">${t.name}</span>`;
    }).join('');
    div.innerHTML = `<h3><span class="pnum">Phase ${i + 1}</span>${p.title}</h3><p>${p.body}</p><div class="names">${names}</div>`;
    wrap.append(div);
  });
  const miss = $('missables');
  miss.replaceChildren();
  for (const t of trophies.filter((x) => x.missable)) {
    const div = document.createElement('div');
    div.className = 'miss-card';
    div.innerHTML = `<h3>${t.name} — the one flagged missable</h3>
      <p><strong>When it can be missed:</strong> one of the 18 meditation spots is Lucia\u2019s balcony in Chapter 1, the morning after the mission Down to Earth. It disappears when Chapter 1 ends; miss it and the set can never be completed on that save.</p>
      <p>GTABase and PowerPyx are the guides that flag this trophy (reported via EGamers); WikiGTAVI pinpoints the Chapter 1 balcony moment. Meditate at every spot the game offers, and keep a Chapter 1 manual save until this trophy is safe.</p>`;
    miss.append(div);
  }
  const caution = document.createElement('div');
  caution.className = 'miss-card';
  caution.innerHTML = `<h3>Not missable — but protect yourself anyway</h3>
    <p>No other trophy is confirmed missable: every other guide we cite agrees the rest of the list is either story progression (which unlocks as you play) or repeatable free-roam work. The real risk is structural: with <strong>no mission replay</strong>, a chapter-specific moment you walk past is gone for that save. A manual save at each chapter start — and one before the final mission — costs nothing and covers all of it. And keep cheats off: they disable trophies and saving for the session.</p>`;
  miss.append(caution);
}

function openDetail(id) {
  const t = byId.get(id);
  if (!t) return;
  state.selected = id;
  const body = $('detailBody');
  if (isMasked(t)) {
    body.innerHTML = `<span class="badge ${t.grade}">${t.grade}</span>
      <h2>${displayName(t)}</h2>
      <p class="official">${displayDesc(t)}</p>
      <p>Spoiler protection is on, so this guide stays covered until you earn the trophy. Turn protection off in the toolbar to read it now.</p>`;
  } else {
    const srcs = t.sources.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.name}</a></li>`).join('');
    body.innerHTML = `<span class="badge ${t.grade}">${t.grade}</span>
      <h2>${t.name}</h2>
      <p class="official">“${t.description}”</p>
      <div class="meta-row">${tagRow(t)}</div>
      <label class="earn-line"><input type="checkbox" id="detailEarned" ${earned.has(t.id) ? 'checked' : ''}> I have earned this trophy</label>
      ${t.count != null ? `<h4>Tracked target</h4><p>PlayStation tracks this trophy to <strong>${t.count.toLocaleString('en-US')}</strong>. Keep an eye on the in-game counter as you go.</p>` : ''}
      <h4>Guide</h4>
      <p>${t.guide}</p>
      <h4>Sources</h4>
      <ul>${srcs}</ul>`;
    $('detailEarned').addEventListener('change', (e) => {
      if (e.target.checked) earned.add(t.id); else earned.delete(t.id);
      save(); render();
    });
  }
  $('detail').hidden = false;
  $('scrim').hidden = false;
}
function closeDetail() {
  state.selected = null;
  $('detail').hidden = true;
  $('scrim').hidden = true;
}

function render() {
  renderProgress();
  renderCards();
  if (state.view === 'roadmap') renderRoadmap();
  $('checklistView').hidden = state.view !== 'checklist';
  $('roadmapView').hidden = state.view !== 'roadmap';
  $('tabChecklist').classList.toggle('active', state.view === 'checklist');
  $('tabRoadmap').classList.toggle('active', state.view === 'roadmap');
  if (state.selected != null && !$('detail').hidden) openDetail(state.selected);
}

/* ---------- controls ---------- */
$('kindChips').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-kind]');
  if (!btn) return;
  state.kind = btn.dataset.kind;
  for (const b of $('kindChips').querySelectorAll('.chip')) b.classList.toggle('active', b === btn);
  state.view = 'checklist';
  render();
});
$('gradeFilter').addEventListener('change', (e) => { state.grade = e.target.value; render(); });
$('searchBox').addEventListener('input', (e) => { state.query = e.target.value.trim(); render(); });
$('spoilerToggle').checked = spoiler;
$('spoilerToggle').addEventListener('change', (e) => { spoiler = e.target.checked; save(); render(); });
$('tabChecklist').addEventListener('click', () => { state.view = 'checklist'; render(); });
$('tabRoadmap').addEventListener('click', () => { state.view = 'roadmap'; render(); });
$('detailClose').addEventListener('click', closeDetail);
$('scrim').addEventListener('click', closeDetail);

$('exportBtn').addEventListener('click', () => {
  const payload = JSON.stringify({ game: 'Grand Theft Auto VI', platform: 'PlayStation 5', earned: [...earned].sort((a, b) => a - b), spoiler }, null, 1);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});
$('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const ids = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(ids)) throw new Error('bad file');
    earned = new Set(ids.filter((id) => byId.has(id)));
    if (typeof parsed.spoiler === 'boolean') { spoiler = parsed.spoiler; $('spoilerToggle').checked = spoiler; }
    save(); render();
  } catch {
    $('resultLine').textContent = 'That file could not be read as trophy progress.';
  }
  e.target.value = '';
});

render();
if (shot === 'guide') openDetail(28);
