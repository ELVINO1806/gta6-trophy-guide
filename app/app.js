
const STORE_EARNED = 'ltl-earned-v1';
const STORE_COUNTS = 'ltl-counts-v1';

const FILTERS = [
  ['all', 'All'],
  ['earned', 'Earned'],
  ['unearned', 'Unearned'],
  ['platinum', 'Platinum'],
  ['gold', 'Gold'],
  ['silver', 'Silver'],
  ['bronze', 'Bronze'],
  ['hidden', 'Hidden'],
  ['missable', 'Missable'],
  ['tracked', 'Tracked'],
];

const ROADMAP = [
  { n: 1, title: 'Story sweep', text: 'Play the story start to finish. Chapters 1 to 4, the mission beats and the final mission all unlock in order.', ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] },
  { n: 2, title: 'Side missions', text: 'Finish every contact strand: Andy, Kenton, Billy, Randy, Tyrone, plus Bret’s hunt. Each strand ends with its own trophy.', ids: [22, 23, 24, 26, 27, 29] },
  { n: 3, title: 'Activities', text: 'Try all 9 activity types, then chase the golds: shooting range, drone races, street races, fishing, arcade and bowling.', ids: [16, 17, 18, 19, 20, 21, 46] },
  { n: 4, title: 'Collectibles and discovery', text: 'Sweep the map region by region: card sets, WAiNK It spots, vehicles, areas and Scooter Bros registrations.', ids: [30, 31, 35, 42, 55] },
  { n: 5, title: 'Combat and driving', text: 'Stunts, challenges, Combat Focus, Rhinos, bank vaults and armored trucks. Do these while the map is still fresh.', ids: [15, 32, 36, 38, 40, 41] },
  { n: 6, title: 'Money and properties', text: 'Launder the marked bills from your heists, spend big in the shops, then buy all 8 garage properties.', ids: [52, 53, 54] },
  { n: 7, title: 'Cleanup and platinum', text: 'Stranger strands, the 500 choices, the odd moments, and the 100 percent checklist. Check the missable trophy is done, then take the platinum.', ids: [1, 14, 25, 28, 33, 34, 37, 39, 43, 44, 45, 47, 48, 49, 50, 51] },
];

let trophies = [];
let earned = new Set();
let counts = {};
let filter = 'all';
let query = '';
let hideSpoilers = true;
let currentView = 'tracker';

function loadStore() {
  try { earned = new Set(JSON.parse(localStorage.getItem(STORE_EARNED) || '[]')); } catch { earned = new Set(); }
  try { counts = JSON.parse(localStorage.getItem(STORE_COUNTS) || '{}'); } catch { counts = {}; }
}
function saveStore() {
  localStorage.setItem(STORE_EARNED, JSON.stringify([...earned]));
  localStorage.setItem(STORE_COUNTS, JSON.stringify(counts));
}
function byId(id) { return trophies.find(t => t.id === id); }
function isMasked(t) { return hideSpoilers && t.hidden; }
function displayName(t) { return isMasked(t) ? 'Hidden Trophy' : t.name; }
function displayDesc(t) { return isMasked(t) ? 'Hidden — turn off the spoiler mask to see this trophy.' : t.description; }

function matchesFilter(t) {
  if (filter === 'earned') return earned.has(t.id);
  if (filter === 'unearned') return !earned.has(t.id);
  if (filter === 'hidden') return t.hidden;
  if (filter === 'missable') return t.missable;
  if (filter === 'tracked') return t.target !== null;
  if (filter === 'platinum' || filter === 'gold' || filter === 'silver' || filter === 'bronze') return t.grade === filter;
  return true;
}
function matchesQuery(t) {
  if (!query) return true;
  const hay = (displayName(t) + ' ' + t.description + ' ' + t.guide).toLowerCase();
  return hay.includes(query.toLowerCase());
}

function gradeBadge(t) {
  return '<span class="grade grade-' + t.grade + '">' + t.grade + '</span>';
}
function metaLine(t) {
  const bits = [];
  if (t.missable) bits.push('<span class="badge-missable">MISSABLE</span>');
  if (t.hidden) bits.push('<span class="badge-hidden">Hidden</span>');
  if (t.target !== null) bits.push('Target: ' + (counts[t.id] || 0) + ' / ' + t.target + ' ' + t.target_label);
  return bits.join(' &middot; ');
}

function cardHtml(t) {
  const masked = isMasked(t);
  const done = earned.has(t.id);
  let html = '<article class="trophy-card' + (done ? ' earned' : '') + '" data-id="' + t.id + '" tabindex="0">';
  html += gradeBadge(t);
  html += '<h3>' + escapeHtml(displayName(t)) + '</h3>';
  html += '<p>' + escapeHtml(displayDesc(t)) + '</p>';
  html += '<div class="meta">' + metaLine(t) + '</div>';
  html += '<div class="check-row"><button type="button" data-act="toggle">' + (done ? '✓ Earned — undo' : 'Mark earned') + '</button></div>';
  if (t.target !== null) {
    html += '<div class="stepper"><button type="button" data-act="dec" aria-label="Decrease count">−</button><span>' + (counts[t.id] || 0) + ' / ' + t.target + ' ' + escapeHtml(t.target_label) + '</span><button type="button" data-act="inc" aria-label="Increase count">+</button></div>';
  }
  html += '</article>';
  return html;
}
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderFilters() {
  const box = document.getElementById('filters');
  box.innerHTML = FILTERS.map(([key, label]) =>
    '<button type="button" class="filter-btn' + (filter === key ? ' active' : '') + '" data-filter="' + key + '">' + label + '</button>'
  ).join('');
  box.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => { filter = btn.dataset.filter; renderAll(); });
  });
}
function renderProgress() {
  const done = earned.size;
  const pct = Math.round(done / trophies.length * 100);
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressText').textContent = done + ' / ' + trophies.length + ' earned · ' + pct + '%';
  const parts = ['platinum', 'gold', 'silver', 'bronze'].map(g => {
    const total = trophies.filter(t => t.grade === g).length;
    const got = trophies.filter(t => t.grade === g && earned.has(t.id)).length;
    return g[0].toUpperCase() + g.slice(1) + ' ' + got + '/' + total;
  });
  document.getElementById('gradeCounts').textContent = parts.join(' · ');
}
function renderList() {
  const list = trophies.filter(t => matchesFilter(t) && matchesQuery(t));
  document.getElementById('resultCount').textContent = list.length + ' of ' + trophies.length + ' trophies shown';
  document.getElementById('trophyList').innerHTML = list.map(cardHtml).join('');
}
function renderRoadmap() {
  document.getElementById('roadmapList').innerHTML = ROADMAP.map(stage => {
    const got = stage.ids.filter(id => earned.has(id)).length;
    const names = stage.ids.map(id => escapeHtml(displayName(byId(id)))).join(', ');
    return '<div class="roadmap-stage"><h3><span class="stage-num">Stage ' + stage.n + '.</span> ' + escapeHtml(stage.title) + ' — ' + got + ' / ' + stage.ids.length + '</h3><p>' + escapeHtml(stage.text) + '</p><p class="stage-trophies">' + names + '</p></div>';
  }).join('');
}
function renderMissables() {
  const miss = trophies.filter(t => t.missable);
  document.getElementById('missableList').innerHTML = miss.map(cardHtml).join('');
}
function renderAll() {
  renderFilters();
  renderProgress();
  renderList();
  renderRoadmap();
  renderMissables();
}

function openGuide(id) {
  const t = byId(id);
  if (!t) return;
  const panel = document.getElementById('guidePanel');
  let html = '<button type="button" class="close-guide" id="closeGuide">Close</button>';
  html += gradeBadge(t);
  html += '<h2>' + escapeHtml(displayName(t)) + '</h2>';
  html += '<p>' + escapeHtml(displayDesc(t)) + '</p>';
  if (t.missable) html += '<p><span class="badge-missable">MISSABLE — do this in Chapter 1, before the chapter ends.</span></p>';
  if (!isMasked(t)) {
    html += '<h3>Guide</h3><p>' + escapeHtml(t.guide) + '</p>';
    if (t.target !== null) html += '<p>Target: ' + (counts[t.id] || 0) + ' / ' + t.target + ' ' + escapeHtml(t.target_label) + '</p>';
    html += '<h3>Sources</h3><p class="sources">' + t.sources.map(s => '<a href="' + escapeHtml(s.url) + '" target="_blank" rel="noopener">' + escapeHtml(s.site) + '</a>').join(' · ') + '</p>';
  } else {
    html += '<p>Guide hidden by the spoiler mask. Turn the mask off to read it.</p>';
  }
  panel.innerHTML = html;
  panel.hidden = false;
  document.getElementById('closeGuide').addEventListener('click', () => { panel.hidden = true; });
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function setView(view) {
  currentView = view;
  document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('active', tab.dataset.view === view));
  document.getElementById('view-tracker').hidden = view !== 'tracker';
  document.getElementById('view-roadmap').hidden = view !== 'roadmap';
  document.getElementById('view-missables').hidden = view !== 'missables';
}
function applyParams() {
  const params = new URLSearchParams(location.search);
  if (params.get('view') && ['tracker', 'roadmap', 'missables'].includes(params.get('view'))) setView(params.get('view'));
  if (params.get('filter') && FILTERS.some(([k]) => k === params.get('filter'))) filter = params.get('filter');
  if (params.get('spoiler') === 'off') { hideSpoilers = false; document.getElementById('spoilerToggle').checked = false; }
  if (params.get('spoiler') === 'on') { hideSpoilers = true; document.getElementById('spoilerToggle').checked = true; }
  const id = Number(params.get('id'));
  if (id) openGuide(id);
}

function bindEvents() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => setView(tab.dataset.view));
  });
  document.getElementById('search').addEventListener('input', e => { query = e.target.value; renderList(); });
  document.getElementById('spoilerToggle').addEventListener('change', e => { hideSpoilers = e.target.checked; renderAll(); });
  document.getElementById('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ earned: [...earned], counts }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'leonida-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById('importFile').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (Array.isArray(data.earned)) earned = new Set(data.earned.filter(id => byId(id)));
        if (data.counts && typeof data.counts === 'object') counts = data.counts;
        saveStore();
        renderAll();
      } catch { alert('That file is not valid progress JSON.'); }
    };
    reader.readAsText(file);
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    earned = new Set();
    counts = {};
    saveStore();
    renderAll();
  });
  document.getElementById('trophyList').addEventListener('click', e => {
    const card = e.target.closest('.trophy-card');
    if (!card) return;
    const id = Number(card.dataset.id);
    const act = e.target.dataset.act;
    if (act === 'toggle') {
      if (earned.has(id)) earned.delete(id); else earned.add(id);
      saveStore();
      renderAll();
      return;
    }
    if (act === 'inc') {
      const t = byId(id);
      counts[id] = Math.min((counts[id] || 0) + 1, t.target);
      saveStore();
      renderAll();
      return;
    }
    if (act === 'dec') {
      counts[id] = Math.max((counts[id] || 0) - 1, 0);
      saveStore();
      renderAll();
      return;
    }
    openGuide(id);
  });
  document.getElementById('missableList').addEventListener('click', e => {
    const card = e.target.closest('.trophy-card');
    if (!card) return;
    const id = Number(card.dataset.id);
    const act = e.target.dataset.act;
    if (act === 'toggle') {
      if (earned.has(id)) earned.delete(id); else earned.add(id);
      saveStore();
      renderAll();
      return;
    }
    if (act === 'inc' || act === 'dec') {
      const t = byId(id);
      const next = act === 'inc' ? Math.min((counts[id] || 0) + 1, t.target) : Math.max((counts[id] || 0) - 1, 0);
      counts[id] = next;
      saveStore();
      renderAll();
      return;
    }
    openGuide(id);
  });
}

async function main() {
  loadStore();
  const res = await fetch('data/trophies.json');
  const data = await res.json();
  trophies = data.trophies;
  bindEvents();
  renderAll();
  applyParams();
  renderAll();
}
main();

