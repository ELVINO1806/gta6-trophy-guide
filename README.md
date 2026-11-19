# Leonida Trophy Ledger — GTA VI Trophy Guide & Tracker

[![Competition](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/ELVINO1806/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/ELVINO1806/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline trophy guide and progress tracker for **Grand Theft Auto VI (PlayStation 5)**, built for the make.fun bounty [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01). Open `app/index.html` (or serve `app/` with `node serve.ts`) — no build step, no network, no accounts.

## What it does

- **All 55 official trophies** with their exact PlayStation name, description and grade (1 platinum, 2 gold, 6 silver, 46 bronze), including the 28 hidden trophies.
- **A cited guide for every trophy** — original text covering what it asks, when it comes in the story flow or what count it tracks, the practical way to earn it, and the miss risk where one exists. Each guide names its sources beside it.
- **Progress tracker** — tick trophies off, watch the earned count, percentage and per-grade totals update; progress saves in the browser, and **Export / Import** moves it between devices as a JSON file.
- **Filters that match how you hunt** — Story, Missable, Collectibles, Activities and Online (the list is entirely single-player, and the app says so), plus a grade filter and text search.
- **Spoiler protection** — on by default, it masks unearned story and hidden trophies ("Hidden — story trophy") until you earn them; earned ones reveal.
- **Platinum roadmap** — six phases built from the official descriptions: story first with chapter-save discipline, stranger strands, collections, activity grinds, money and robberies, then 100% completion and the platinum.
- **Missables section** — the one trophy launch guides flag as possibly missable (*Positive Mental Attitude*, via its Chapter 1 meditation spot) with exactly when it can be lost, plus the no-mission-replay and cheats warnings that protect the whole run.

## Data & sources

Names, descriptions and grades are the official list published 18 November 2026. Hidden flags (28 hidden / 27 visible) follow the published list as carried by **Exophase** and cross-checked with **PSNProfiles** (via PlanetGTA6's full table). Tracked counts come from the official descriptions. Missable and timing details are cited per trophy from EGamers, Output Lag, GTABase, Vice City Hub and WikiGTAVI. Where launch guides disagreed or a trigger was unconfirmed, the guide says so instead of inventing steps.

## Layout

- `app/` — the static web app (`index.html`, `style.css`, `app.js`, `data/trophies.json`); fully self-contained and offline.
- `screenshots/` — the four hand-in screenshots (checklist, guide detail, roadmap, spoiler protection).
- `main.ts` — the hand-in program: validates `trophies.json` (exactly 55 trophies, non-blank guides, sources present), then copies `app/` and `screenshots/` to the output directory and writes `dossier.json`. Two runs produce byte-identical output.
- `serve.ts` — a tiny local server for trying the app.
- `vendor/makefun-frontend.ts` — the kit's dossier builder, unmodified.

Fan-made tool; not affiliated with Rockstar Games. No Rockstar artwork, logos or screenshots are used — the look is original CSS.
