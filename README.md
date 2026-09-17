# sovereign-dispersal

Bun monolith fusing seven overlooked substrates into one deploy-ready proof-of-concept: sovereign fs-map, ralph regen, pi-natives, fastest-wins cancel-rest transport, the empty-backhaul profit oracle, an AVO dual-latent loop, and event contracts.

## The seven substrates

1. **Sovereign FS-Map** (`src/sovereign/fs-map.ts`) — audits the big local trees, counts symlinks and git repos, surfaces duplicate top-level names across roots, persists JSON to `~/.config/sovereign-fs-map.json`.
2. **Ralph regen** (`src/ralph/fix.ts`) — strips orphan role keys (`planning=`, `development=`, …) from `~/.config/ralph-workflow.toml`, always backing up first, then sanity-checks string `cmd` and the `exa`/`ddgs` provider enum.
3. **Pi-natives loader** (`src/natives/loader.ts`) — builds explicit native targets one by one so a single broken target can't wedge the loader; skips cleanly when the engine checkout isn't present.
4. **Fastest-wins transport** (`src/transport/fastest-wins.ts` + `route-a.ts`) — races TCP probes with `Promise.any` + `AbortController`: first OPEN socket wins, the rest are cancelled. Rejection-tolerant — a fast failure never beats a slower success; rejects only when every probe fails. Route A applies it to a zod-validated endpoint set with a live/expected truth table (`verifyLive()`) and the documented resolver repair (`dnsFix()`).
5. **Empty-backhaul oracle** (`src/profit/backhaul.ts`) — models the EBITDA lift from buying empty return legs at a discount: 2.5% → 7.33%, a 2.93× lift at 25% discount (zod-validated inputs).
6. **AVO dual-latent loop** (`src/profit/avo.ts`) — routes each step through the visual (`Z^v`) or reasoning (`Z^r`) latent with router width k ∈ {4, 8, 16}; seeded runs are reproducible.
7. **Event contracts** (`src/profit/event-contracts.ts`) — prediction-market substrate: targets, settlement rules, cents-as-probability, trading-prohibition checks.

## Quickstart

```bash
bun install
bunx biome check ./src ./scripts ./tests
bun test
bun run dev          # walks all seven substrates
```

Open `dashboard.html` in a browser for the animated substrate dashboard (fastest-wins pulse, backhaul flow, AVO memory bricks, Route A truth table).

## Scripts

| script | does |
|---|---|
| `bun run dev` | full substrate walk (`src/index.ts`) |
| `bun run route-a` | Route A race + truth table |
| `bun run audit` | fs-map audit |
| `bun run ralph:fix` | ralph workflow repair (backs up first) |
| `bun run natives:build` | pi-natives targets |
| `bun run profit:backhaul` / `profit:avo` | the two profit toys |
| `bun run deploy` | bun build → docker build → optional push (`DEPLOY_PUSH=1`, `DEPLOY_IMAGE=…`) |

## Deploy

`bun run deploy` produces the Docker image (see `Dockerfile`, multi-stage, runs as non-root `bun`). Distribute at the edge via Fastly / Comcast Qwilt Open Edge; mount data with a Modal `CloudBucketMount` at `/mnt/s3/my-data`.

## Notes

- The Route A endpoint list names real hosts probed during development; `cdn` and `sandbox.team` are unresolvable by design (they're the expected-FAIL rows).
- `ralph:fix` and `audit` touch `~/.config/` on the machine they run on — that's the point, but know it before running in CI (tests never touch home).
