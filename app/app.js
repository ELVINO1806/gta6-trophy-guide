
const STORE_KEY = 'leonida-trophy-ledger-v1';
const DATA_URL = 'data/trophies.json';

const ROADMAP_STAGES = [
  { title: 'Stage 1 — Play the story, Chapters 1 to 4', body: 'Story trophies unlock as you play: the opening mission, the four chapters and the named missions in between. Nothing to hunt here; just play the story through.', ids: [2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13] },
  { title: 'Stage 2 — Meditate early: the one missable', body: 'Positive Mental Attitude is the only trophy the guides flag as possibly missable, and its 18 meditation spots are tied to Chapter 1. Meditate at every spot the moment you find it. Do not leave this for after the story.', ids: [28] },
  { title: 'Stage 3 — Stranger strands while they are open', body: 'Stranger missions appear as you explore, and some strands only open during certain story chapters. Start each strand when it appears and finish it before the story moves on.', ids: [22, 23, 24, 26, 27, 29, 25] },
  { title: 'Stage 4 — Finish the story', body: 'Complete the final mission for the gold story trophy, then the 100% completion grind begins. The rest of this roadmap is what 100% asks for.', ids: [7, 14] },
  { title: 'Stage 5 — Collectibles sweep, area by area', body: 'Cards, WAiNK spots, vehicles, areas, garages and Scooter Bros registrations. Work one district at a time and clear every spot in it before moving on.', ids: [30, 31, 35, 42, 54, 55] },
  { title: 'Stage 6 — Activities, races and combat', body: 'Stunts, the shooting range, drone races, fishing, bowling, arcade games, challenges, wanted-level escapes and the robberies. Most of these finish themselves while you play; the range and the races are the deliberate grinds.', ids: [15, 16, 17, 18, 19, 20, 21, 32, 33, 34, 36, 37, 38, 39, 40, 41, 43, 46, 51] },
  { title: 'Stage 7 — Money and the odd ones out', body: 'Launder marked bills, spend across the shops, and mop up the strange ones: choices, the cocktail on Ocean Beach, the showroom escape, the second try, and the partnership trophy. Then the platinum is yours.', ids: [52, 53, 48, 44, 45, 47, 49, 50, 1] },
];

let trophies = [];
let progress = { earned: {}, counts: {} };
let currentFilter = 'all';
let currentSearch = '';
let spoilerOn = false;
let selectedId = null;

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') progress = { earned: parsed.earned || {}, counts: parsed.counts || {} };
    }
  } catch (e) { progress = { earned: {}, counts: {} }; }
}

function saveProgress() {
  localStorage.setItem(STORE_KEY, JSON.stringify(progress));
}

async function loadTrophies() {
  const res = await fetch(DATA_URL);
  const data = await res.json();
  trophies = data.trophies || data;
  renderAll();
}

function trophyById(id) {
  return trophies.find((t) => t.id === id);
}

function isEarned(t) {
  return !!progress.earned[t.id];
}

function countValue(t) {
  return progress.counts[t.id] || 0;
}

function updateProgress() {
  const earned = trophies.filter(isEarned).length;
  document.getElementById('earnedCount').textContent = String(earned);
  document.getElementById('progressFill').style.width = (trophies.length ? (earned / trophies.length) * 100 : 0) + '%';
}

function gradeLabel(t) {
  return t.grade.charAt(0).toUpperCase() + t.grade.slice(1);
}

function spoilerMasked(t) {
  return spoilerOn && t.kind === 'story' && t.hidden && !isEarned(t);
}

function applyFilters(list) {
  let out = list;
  if (currentFilter === 'story') out = out.filter((t) => t.kind === 'story');
  if (currentFilter === 'missable') out = out.filter((t) => t.missable);
  if (currentFilter === 'collectible') out = out.filter((t) => t.kind === 'collectible');
  if (currentFilter === 'activity') out = out.filter((t) => t.kind === 'activity');
  if (currentFilter === 'combat') out = out.filter((t) => t.kind === 'combat');
  if (currentFilter === 'money') out = out.filter((t) => t.kind === 'money');
  if (currentFilter === 'hidden') out = out.filter((t) => t.hidden);
  if (currentFilter === 'earned') out = out.filter(isEarned);
  if (currentFilter === 'remaining') out = out.filter((t) => !isEarned(t));
  if (currentFilter === 'online') out = [];
  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    out = out.filter((t) => (t.name + ' ' + t.description).toLowerCase().includes(q));
  }
  return out;
}

function renderList() {
  const list = document.getElementById('trophyList');
  const items = applyFilters(trophies);
  document.getElementById('onlineNote').hidden = currentFilter !== 'online';
  list.innerHTML = '';
  if (!items.length) {
    const li = document.createElement('li');
    li.textContent = currentFilter === 'online' ? 'No online trophies: all 55 are offline, single-player.' : 'No trophies match this filter.';
    li.className = 'detail-empty';
    list.appendChild(li);
    return;
  }
  for (const t of items) {
    const li = document.createElement('li');
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'trophy-row' + (isEarned(t) ? ' earned' : '') + (selectedId === t.id ? ' selected' : '');
    const masked = spoilerMasked(t);
    const check = document.createElement('span');
    check.className = 'check';
    check.textContent = isEarned(t) ? '✓' : '';
    check.title = isEarned(t) ? 'Earned — click to unmark' : 'Not earned — click to mark earned';
    check.addEventListener('click', (ev) => { ev.stopPropagation(); toggleEarned(t); });
    const body = document.createElement('span');
    const name = document.createElement('span');
    name.className = 'trophy-name' + (masked ? ' spoiler-mask' : '');
    name.textContent = masked ? 'Hidden story trophy' : t.name;
    const desc = document.createElement('span');
    desc.className = 'trophy-desc' + (masked ? ' spoiler-mask' : '');
    desc.textContent = masked ? 'Earn this trophy to reveal its name and description.' : t.description;
    const meta = document.createElement('span');
    meta.className = 'trophy-meta';
    const grade = document.createElement('span');
    grade.className = 'grade grade-' + t.grade;
    grade.textContent = gradeLabel(t);
    meta.appendChild(grade);
    if (t.hidden) { const tag = document.createElement('span'); tag.className = 'tag tag-hidden'; tag.textContent = 'Hidden'; meta.appendChild(tag); }
    if (t.missable) { const tag = document.createElement('span'); tag.className = 'tag tag-missable'; tag.textContent = 'MISSABLE'; meta.appendChild(tag); }
    if (t.count) { const pill = document.createElement('span'); pill.className = 'count-pill'; pill.textContent = countValue(t) + ' / ' + t.count; meta.appendChild(pill); }
    body.appendChild(name);
    body.appendChild(document.createElement('br'));
    body.appendChild(desc);
    body.appendChild(document.createElement('br'));
    body.appendChild(meta);
    row.appendChild(check);
    row.appendChild(body);
    row.addEventListener('click', () => { selectedId = t.id; renderList(); renderDetail(); });
    li.appendChild(row);
    list.appendChild(li);
  }
}

function toggleEarned(t) {
  if (isEarned(t)) delete progress.earned[t.id];
  else progress.earned[t.id] = true;
  saveProgress();
  updateProgress();
  renderList();
  renderDetail();
}

function setCount(t, value) {
  const n = Math.max(0, Math.min(t.count, Math.floor(Number(value) || 0)));
  progress.counts[t.id] = n;
  if (n >= t.count) progress.earned[t.id] = true;
  else if (progress.earned[t.id] && n < t.count) delete progress.earned[t.id];
  saveProgress();
  updateProgress();
  renderList();
  renderDetail();
}

function renderDetail() {
  const panel = document.getElementById('detailPanel');
  const t = selectedId ? trophyById(selectedId) : null;
  panel.innerHTML = '';
  if (!t) {
    const p = document.createElement('p');
    p.className = 'detail-empty';
    p.textContent = 'Pick a trophy on the left to read its guide, its sources and its count tracker.';
    panel.appendChild(p);
    return;
  }
  const masked = spoilerMasked(t);
  const h = document.createElement('h3');
  h.textContent = masked ? 'Hidden story trophy' : t.name;
  panel.appendChild(h);
  const grades = document.createElement('div');
  grades.className = 'grade-row';
  const grade = document.createElement('span');
  grade.className = 'grade grade-' + t.grade;
  grade.textContent = gradeLabel(t);
  grades.appendChild(grade);
  if (t.hidden) { const tag = document.createElement('span'); tag.className = 'tag tag-hidden'; tag.textContent = 'Hidden until earned'; grades.appendChild(tag); }
  if (t.missable) { const tag = document.createElement('span'); tag.className = 'tag tag-missable'; tag.textContent = 'MISSABLE — see the Missables tab'; grades.appendChild(tag); }
  panel.appendChild(grades);
  const desc = document.createElement('p');
  desc.textContent = masked ? 'This is a hidden story trophy. Its name and description stay hidden here until you earn it.' : 'Official description: ' + t.description;
  panel.appendChild(desc);
  if (!masked) {
    const guideTitle = document.createElement('p');
    guideTitle.innerHTML = '<strong>Guide</strong>';
    panel.appendChild(guideTitle);
    const guide = document.createElement('p');
    guide.textContent = t.guide;
    panel.appendChild(guide);
    if (t.count) {
      const tracker = document.createElement('div');
      tracker.className = 'count-tracker';
      const minus = document.createElement('button');
      minus.type = 'button';
      minus.textContent = '−';
      minus.addEventListener('click', () => setCount(t, countValue(t) - 1));
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.max = String(t.count);
      input.value = String(countValue(t));
      input.setAttribute('aria-label', 'Count progress');
      input.addEventListener('change', () => setCount(t, input.value));
      const plus = document.createElement('button');
      plus.type = 'button';
      plus.textContent = '+';
      plus.addEventListener('click', () => setCount(t, countValue(t) + 1));
      const label = document.createElement('span');
      label.textContent = 'of ' + t.count + ' — reaching the target marks the trophy earned.';
      tracker.appendChild(minus);
      tracker.appendChild(input);
      tracker.appendChild(plus);
      tracker.appendChild(label);
      panel.appendChild(tracker);
    }
    const src = document.createElement('p');
    src.className = 'sources';
    src.textContent = 'Sources for this guide: ' + t.sources.join(', ') + '. Guide text is original, written for this entry.';
    panel.appendChild(src);
  }
}

function renderRoadmap() {
  const list = document.getElementById('roadmapList');
  list.innerHTML = '';
  for (const stage of ROADMAP_STAGES) {
    const li = document.createElement('li');
    const h = document.createElement('h3');
    h.textContent = stage.title;
    const body = document.createElement('p');
    body.textContent = stage.body;
    const names = document.createElement('p');
    names.className = 'stage-trophies';
    names.textContent = 'Trophies: ' + stage.ids.map((id) => { const t = trophyById(id); return t ? t.name : '#' + id; }).join(' · ');
    li.appendChild(h);
    li.appendChild(body);
    li.appendChild(names);
    list.appendChild(li);
  }
}

function renderMissables() {
  const wrap = document.getElementById('missableCards');
  wrap.innerHTML = '';
  const t = trophyById(28);
  if (t) {
    const card = document.createElement('div');
    card.className = 'missable-card';
    const h = document.createElement('h3');
    h.textContent = '⚠ ' + t.name + ' — possibly missable';
    const p = document.createElement('p');
    p.textContent = t.guide;
    const src = document.createElement('p');
    src.className = 'sources-line';
    src.textContent = 'Flagged by GTABase and PowerPyx as the only possibly missable trophy.';
    card.appendChild(h);
    card.appendChild(p);
    card.appendChild(src);
    wrap.appendChild(card);
  }
  const watch = document.createElement('div');
  watch.className = 'missable-card watch';
  const wh = document.createElement('h3');
  wh.textContent = 'Watch: stranger chains';
  const wp = document.createElement('p');
  wp.textContent = 'The stranger mission chains behind five hidden trophies have windows linked to story progress. Start each strand when it appears and finish it before the story moves on; do not leave the whole chain for after the final mission.';
  const wsrc = document.createElement('p');
  wsrc.className = 'sources-line';
  wsrc.textContent = 'Reported by TechWiser. Trophies: Road to Rehabilitation, This Was No Boat Accident, The Lone Rider, Supply & Demand, Spin On This!';
  watch.appendChild(wh);
  watch.appendChild(wp);
  watch.appendChild(wsrc);
  wrap.appendChild(watch);
}

function renderAll() {
  updateProgress();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
}

function exportProgress() {
  const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (parsed && typeof parsed === 'object') {
        progress = { earned: parsed.earned || {}, counts: parsed.counts || {} };
        saveProgress();
        renderAll();
      }
    } catch (e) { alert('That file is not a valid progress export.'); }
  };
  reader.readAsText(file);
}

function switchView(name) {
  document.getElementById('trackerView').hidden = name !== 'tracker';
  document.getElementById('roadmapView').hidden = name !== 'roadmap';
  document.getElementById('missablesView').hidden = name !== 'missables';
  for (const btn of document.querySelectorAll('.tab')) {
    btn.classList.toggle('active', btn.dataset.view === name);
  }
}

document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});
document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter;
    renderList();
  });
});
document.getElementById('searchBox').addEventListener('input', (ev) => {
  currentSearch = ev.target.value.trim();
  renderList();
});
document.getElementById('spoilerToggle').addEventListener('change', (ev) => {
  spoilerOn = ev.target.checked;
  renderList();
  renderDetail();
});
document.getElementById('exportBtn').addEventListener('click', exportProgress);
document.getElementById('importFile').addEventListener('change', (ev) => {
  if (ev.target.files && ev.target.files[0]) importProgress(ev.target.files[0]);
  ev.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Clear all earned marks and counts?')) {
    progress = { earned: {}, counts: {} };
    saveProgress();
    renderAll();
  }
});

loadProgress();
loadTrophies();

