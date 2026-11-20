
(function () {
  "use strict";
  var STORE_KEY = "leonida-trophy-ledger-v1";
  var DATA_URL = "data/trophies.json";
  var state = { earned: {}, counts: {}, spoiler: false };
  var trophies = [];
  var listEl = null;
  var progressFill = null;
  var progressText = null;
  var platinumLine = null;
  var searchEl = null;
  var gradeEl = null;
  var statusEl = null;
  var spoilerEl = null;

  function loadState() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        if (parsed.earned && typeof parsed.earned === "object") state.earned = parsed.earned;
        if (parsed.counts && typeof parsed.counts === "object") state.counts = parsed.counts;
        if (typeof parsed.spoiler === "boolean") state.spoiler = parsed.spoiler;
      }
    } catch (e) {
      state = { earned: {}, counts: {}, spoiler: false };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {
      // Storage may be unavailable in some contexts; the page still works.
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function isEarned(t) {
    return !!state.earned[t.id];
  }

  function getCount(t) {
    var n = state.counts[t.id];
    if (typeof n !== "number" || n < 0) return 0;
    if (t.target !== undefined && n > t.target) return t.target;
    return n;
  }

  function setEarned(t, value) {
    if (value) {
      state.earned[t.id] = true;
    } else {
      delete state.earned[t.id];
    }
    saveState();
    render();
  }

  function setCount(t, value) {
    var n = Math.max(0, Math.min(t.target, value));
    state.counts[t.id] = n;
    if (n >= t.target) {
      state.earned[t.id] = true;
    }
    saveState();
    render();
  }

  function isSpoiled(t) {
    return state.spoiler && t.hidden && !isEarned(t);
  }

  function matchesFilters(t) {
    var q = (searchEl.value || "").trim().toLowerCase();
    if (q) {
      var hay = isSpoiled(t) ? "hidden trophy" : (t.name + " " + t.description + " " + t.guide).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    var grade = gradeEl.value;
    if (grade !== "all" && t.grade !== grade) return false;
    var status = statusEl.value;
    if (status === "earned" && !isEarned(t)) return false;
    if (status === "remaining" && isEarned(t)) return false;
    if (status === "missable" && !t.missable) return false;
    return true;
  }

  function cardHtml(t) {
    var spoiled = isSpoiled(t);
    var earned = isEarned(t);
    var classes = ["card"];
    if (earned) classes.push("earned");
    if (t.missable) classes.push("missable");
    var name = spoiled ? "Hidden trophy" : escapeHtml(t.name);
    var desc = spoiled ? "Hidden — earn it to reveal its name and description." : escapeHtml(t.description);
    var guide = spoiled ? "" : "<p class=\"guide\">" + escapeHtml(t.guide) + "</p>";
    var sources = "";
    if (!spoiled && t.sources && t.sources.length) {
      var links = t.sources.map(function (s) {
        return "<a href=\"" + escapeHtml(s.url) + "\" target=\"_blank\" rel=\"noopener\">" + escapeHtml(s.name) + "</a>";
      }).join(" · ");
      sources = "<p class=\"sources\">Sources: " + links + "</p>";
    }
    var tags = "";
    if (t.missable) tags += "<span class=\"tag tag-missable\">Missable</span>";
    if (t.hidden) tags += "<span class=\"tag tag-hidden\">Hidden</span>";
    if (t.target !== undefined) tags += "<span class=\"tag\">Counted · target " + t.target.toLocaleString() + "</span>";
    var stepper = "";
    if (!spoiled && t.target !== undefined) {
      var count = getCount(t);
      stepper = "<div class=\"stepper\" role=\"group\" aria-label=\"Progress toward target\">" +
        "<button type=\"button\" data-act=\"dec\" data-id=\"" + t.id + "\" aria-label=\"Decrease count\">−</button>" +
        "<span class=\"count\">" + count.toLocaleString() + " / " + t.target.toLocaleString() + "</span>" +
        "<button type=\"button\" data-act=\"inc\" data-id=\"" + t.id + "\" aria-label=\"Increase count\">+</button>" +
        "</div>";
    }
    return "<article class=\"" + classes.join(" ") + "\" data-id=\"" + t.id + "\">" +
      "<div class=\"card-head\"><h3>" + name + "</h3>" +
      "<span class=\"badge badge-" + escapeHtml(t.grade) + "\">" + escapeHtml(t.grade) + "</span></div>" +
      "<p class=\"desc\">" + desc + "</p>" +
      guide + sources +
      "<div class=\"tag-row\">" + tags + "</div>" +
      stepper +
      "<label class=\"earn-row\"><input type=\"checkbox\" data-act=\"earn\" data-id=\"" + t.id + "\"" +
      (earned ? " checked" : "") + "> Earned</label>" +
      "</article>";
  }

  function renderProgress() {
    var earned = trophies.filter(isEarned).length;
    var total = trophies.length || 55;
    var pct = total ? Math.round((earned / total) * 100) : 0;
    progressFill.style.width = pct + "%";
    progressText.textContent = earned + " of " + total + " earned · " + pct + "%";
    var remaining = total - earned;
    platinumLine.textContent = remaining === 0
      ? "Platinum earned: Vice Got a Price! Congratulations, Leonida Legend."
      : "Platinum: Vice Got a Price! — " + remaining + " to go.";
  }

  function render() {
    renderProgress();
    var visible = trophies.filter(matchesFilters);
    if (!visible.length) {
      listEl.innerHTML = "<p class=\"empty\">No trophies match these filters. Clear the search or change a filter.</p>";
      return;
    }
    listEl.innerHTML = visible.map(cardHtml).join("");
  }

  function exportProgress() {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "leonida-trophy-progress.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function importProgress(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result));
        if (parsed && typeof parsed === "object") {
          state = { earned: {}, counts: {}, spoiler: state.spoiler };
          if (parsed.earned && typeof parsed.earned === "object") state.earned = parsed.earned;
          if (parsed.counts && typeof parsed.counts === "object") state.counts = parsed.counts;
          saveState();
          render();
        }
      } catch (e) {
        alert("That file is not valid progress data.");
      }
    };
    reader.readAsText(file);
  }

  function bindEvents() {
    searchEl.addEventListener("input", render);
    gradeEl.addEventListener("change", render);
    statusEl.addEventListener("change", render);
    spoilerEl.addEventListener("change", function () {
      state.spoiler = spoilerEl.checked;
      saveState();
      render();
    });
    document.getElementById("export-btn").addEventListener("click", exportProgress);
    document.getElementById("import-btn").addEventListener("click", function () {
      document.getElementById("import-file").click();
    });
    document.getElementById("import-file").addEventListener("change", function (ev) {
      importProgress(ev.target.files && ev.target.files[0]);
      ev.target.value = "";
    });
    document.getElementById("reset-btn").addEventListener("click", function () {
      if (window.confirm("Clear all earned trophies and counts?")) {
        state = { earned: {}, counts: {}, spoiler: state.spoiler };
        saveState();
        render();
      }
    });
    listEl.addEventListener("click", function (ev) {
      var btn = ev.target.closest("button[data-act]");
      if (!btn) return;
      var id = Number(btn.getAttribute("data-id"));
      var t = trophies.find(function (x) { return x.id === id; });
      if (!t || t.target === undefined) return;
      var act = btn.getAttribute("data-act");
      setCount(t, getCount(t) + (act === "inc" ? 1 : -1));
    });
    listEl.addEventListener("change", function (ev) {
      var box = ev.target.closest("input[data-act='earn']");
      if (!box) return;
      var id = Number(box.getAttribute("data-id"));
      var t = trophies.find(function (x) { return x.id === id; });
      if (t) setEarned(t, box.checked);
    });
  }

  function applyHash() {
    var hash = window.location.hash || "";
    if (hash === "#spoiler") {
      state.spoiler = true;
      spoilerEl.checked = true;
      saveState();
    } else if (hash.indexOf("#trophy-") === 0) {
      var id = Number(hash.slice(8));
      var t = trophies.find(function (x) { return x.id === id; });
      if (t) {
        searchEl.value = t.name;
      }
    }
  }

  function init() {
    listEl = document.getElementById("trophy-list");
    progressFill = document.getElementById("progress-fill");
    progressText = document.getElementById("progress-text");
    platinumLine = document.getElementById("platinum-line");
    searchEl = document.getElementById("search");
    gradeEl = document.getElementById("grade-filter");
    statusEl = document.getElementById("status-filter");
    spoilerEl = document.getElementById("spoiler-toggle");
    loadState();
    spoilerEl.checked = state.spoiler;
    bindEvents();
    fetch(DATA_URL)
      .then(function (res) {
        if (!res.ok) throw new Error("trophy data failed to load");
        return res.json();
      })
      .then(function (data) {
        trophies = Array.isArray(data) ? data : data.trophies || [];
        trophies.sort(function (a, b) { return a.id - b.id; });
        applyHash();
        render();
        if (window.location.hash === "#roadmap") {
          var section = document.querySelector(".roadmap");
          if (section) section.scrollIntoView();
        }
      })
      .catch(function () {
        listEl.innerHTML = "<p class=\"empty\">Trophy data failed to load. Check that data/trophies.json is present.</p>";
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

