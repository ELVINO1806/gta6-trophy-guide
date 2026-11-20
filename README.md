
# Leonida Trophy Ledger — GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/ELVINO1806/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/ELVINO1806/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI, built for the [make.fun gta6-trophy-guide-01 bounty](https://make.fun/bounty/gta6-trophy-guide-01).

## What it is

- **All 55 trophies** with their official names, descriptions and grades exactly as PlayStation publishes them: 1 platinum, 2 gold, 6 silver, 46 bronze, 28 of them hidden until earned.
- **An original guide for every trophy**, written for this entry, with the source of each fact named beside it: 111 source citations across 9 sources (Exophase, PSNProfiles, EGamers, GTABase, PowerPyx, Boosting Factory, HowToVideoGame, Beebom, TechWiser). No guide text is copied from any source.
- **A tracker**: check trophies off as you earn them; progress saves in the browser, exports to a file and imports back. Count trackers for the 21 trophies PlayStation tracks with a count (250 stunts, 42 shooting-range golds, 100 WAiNK spots and the rest).
- **Filters** by story, missable, collectibles, activities, combat, money, hidden, earned and remaining, plus search. There are no online trophies in this list — all 55 are offline, single-player — and the app says so instead of pretending otherwise.
- **A spoiler setting** that hides the names and descriptions of story trophies until they are earned.
- **A 7-stage platinum roadmap** built from the official descriptions, and a **missables page** flagging the one trophy reported as possibly missable (Positive Mental Attitude, 18 meditation spots tied to Chapter 1) plus the stranger chains whose windows close with story progress.
- **Fully offline**: static files under `app/`, no network requests at runtime, original artwork and layout only.

## Run it

Serve `app/` with any static HTTP server and open `app/index.html`, or from the repository root:

```sh
node serve.ts
```

then open http://localhost:8080.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library. The build is deterministic: two runs write the same bytes.

## License

MIT — see `LICENSE`.

