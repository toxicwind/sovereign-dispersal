// Pi-natives loader: build explicit native targets one by one so a single
// broken target can't wedge the loader state machine. Skips cleanly when
// the engine checkout isn't present on this machine.

import { join } from "node:path";
import { $ } from "bun";

const TARGETS = ["linux-x64", "pi-iso", "pi-vcs", "pi-natives"] as const;

export async function buildNatives(
	engineRoot?: string,
): Promise<{ built: string[]; skipped: string[]; noEngine: boolean }> {
	const ENGINE =
		engineRoot ??
		join(process.env.HOME ?? "~", "projects/sovereign-projects/tau/engine");
	const script = Bun.file(join(ENGINE, "scripts/bazel-natives.ts"));
	if (!(await script.exists())) {
		console.log(`[natives] no engine checkout at ${ENGINE}, skipping`);
		return { built: [], skipped: [...TARGETS], noEngine: true };
	}
	const built: string[] = [];
	const skipped: string[] = [];
	for (const t of TARGETS) {
		try {
			console.log(`[natives] building ${t}`);
			await $`bun scripts/bazel-natives.ts ${t} --dest packages/natives/native`
				.cwd(ENGINE)
				.quiet();
			built.push(t);
		} catch {
			console.log(`[natives] ${t} failed, continuing`);
			skipped.push(t);
		}
	}
	return { built, skipped, noEngine: false };
}

if (import.meta.main) await buildNatives();
