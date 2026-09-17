// AVO + dual-latent mini-loop: walk envs x levels, route each step through
// the visual (Z^v) or reasoning (Z^r) latent with a router width k in {4,8,16},
// and accumulate the persistent dual memory. Toy model of the real AVO
// harness — deterministic when seeded.

export type Latent = "visual" | "reasoning";
export type AvoStep = {
	env: number;
	level: number;
	latent: Latent;
	k: number;
	actions: number;
};
export type AvoResult = {
	completed: number;
	total: number;
	rhae: number;
	actions: number;
	memory: { visual: AvoStep[]; reasoning: AvoStep[] };
};

const ROUTER_WIDTHS = [4, 8, 16] as const;

/** Tiny mulberry32 PRNG so runs are reproducible with a seed. */
function prng(seed: number) {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export async function avoLoop({
	envs,
	levels,
	seed,
}: {
	envs: number;
	levels: number;
	seed?: number;
}): Promise<AvoResult> {
	const rand = seed === undefined ? Math.random : prng(seed);
	const memory: { visual: AvoStep[]; reasoning: AvoStep[] } = {
		visual: [],
		reasoning: [],
	};
	let completed = 0;
	let actions = 0;
	for (let e = 0; e < envs; e++) {
		for (let l = 0; l < levels; l++) {
			const latent: Latent = rand() > 0.5 ? "visual" : "reasoning";
			const k = ROUTER_WIDTHS[Math.floor(rand() * ROUTER_WIDTHS.length)];
			const stepActions = Math.floor(5 + rand() * 10);
			memory[latent].push({
				env: e,
				level: l,
				latent,
				k,
				actions: stepActions,
			});
			completed++;
			actions += stepActions;
		}
	}
	return { completed, total: envs * levels, rhae: 100.0, actions, memory };
}

if (import.meta.main) {
	const r = await avoLoop({ envs: 2, levels: 6, seed: 42 });
	console.log(
		`AVO: ${r.completed}/${r.total} RHAE ${r.rhae} actions ${r.actions} (v:${r.memory.visual.length} r:${r.memory.reasoning.length})`,
	);
}
