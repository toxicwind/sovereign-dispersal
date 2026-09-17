// sovereign-dispersal: one binary that walks all seven substrates —
// fs-map audit, ralph regen, pi-natives, fastest-wins transport (Route A),
// empty-backhaul oracle, AVO dual-latent loop, event contracts.

import { buildNatives } from "./natives/loader.ts";
import { avoLoop } from "./profit/avo.ts";
import { backhaulProfit } from "./profit/backhaul.ts";
import { hypeMarket, priceToProb } from "./profit/event-contracts.ts";
import { ralphFix } from "./ralph/fix.ts";
import { auditFsMap } from "./sovereign/fs-map.ts";
import { fastestWins } from "./transport/fastest-wins.ts";
import {
	dnsFix,
	fastestWinsCancelRest,
	verifyLive,
} from "./transport/route-a.ts";

console.log("=== sovereign-dispersal ===");

// 1. Sovereign FS-Map
const fsMap = await auditFsMap();
console.log(
	`[fs-map] ${fsMap.roots.length} roots, ${fsMap.dupPairs.length} dup pairs, ${fsMap.symlinks} symlinks, ${fsMap.gitRepos} git repos`,
);

// 2. Ralph regen
await ralphFix();

// 3. Pi-natives (skips cleanly without the engine checkout)
await buildNatives();

// 4. Fastest-wins transport — Route A
console.log("[route-a] dns fix:", JSON.stringify(dnsFix()));
const live = await verifyLive();
const okCount = live.filter((r) => r.ok).length;
console.log(`[route-a] verify: ${okCount}/${live.length} expectations met`);
try {
	const winner = await fastestWinsCancelRest();
	console.log(
		`[route-a] winner: ${winner.name} ${winner.host}:${winner.port} (${winner.ms}ms)`,
	);
} catch (err) {
	console.log(
		`[route-a] no winner: ${err instanceof Error ? err.message : err}`,
	);
}

// 5. Ad-hoc fastest-wins over raw probes
try {
	const winner = await fastestWins([
		{ host: "gator.volces.com", ip: "8.45.176.206", ports: [80, 443, 53] },
		{ host: "development.team", ip: "76.223.54.146", ports: [80, 443] },
		{ host: "8.8.8.8", ports: [80] },
	]);
	console.log(`[fastest-wins] ${winner.host}:${winner.port} ${winner.ms}ms`);
} catch (err) {
	console.log(
		`[fastest-wins] all probes failed: ${err instanceof Error ? err.message : err}`,
	);
}

// 6. Empty-backhaul $100B oracle
const profit = backhaulProfit({ lanes: 40000, trucks: 80000, discount: 0.25 });
console.log(
	`[backhaul] EBITDA ${profit.before}% -> ${profit.after}% (lift ${profit.lift}x)`,
);

// 7. AVO dual-latent mini-loop (seeded = reproducible)
const avo = await avoLoop({ envs: 2, levels: 6, seed: 42 });
console.log(
	`[avo] ${avo.completed}/${avo.total} RHAE ${avo.rhae} actions ${avo.actions}`,
);

// 8. Event contracts substrate
console.log(
	`[event-contracts] HYPE target ${hypeMarket.target} (${hypeMarket.windowStart} -> ${hypeMarket.windowEnd}); 46c = ${priceToProb(46)} probability`,
);
