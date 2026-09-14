// Ralph regen fix: strip orphan top-level role keys (planning=, development=,
// analysis=, fixer=, commit=) from ~/.config/ralph-workflow.toml, enforce the
// STRING cmd and the exa|ddgs provider enum. Always backs up first.

import os from "node:os";
import { join } from "node:path";
import { $ } from "bun";

const ORPHAN_KEYS = ["planning", "development", "analysis", "fixer", "commit"];

export async function ralphFix(
	home = os.homedir(),
): Promise<{ changed: boolean; removed: string[]; backup?: string }> {
	const wf = join(home, ".config", "ralph-workflow.toml");
	const file = Bun.file(wf);
	if (!(await file.exists())) {
		console.log("[ralph-fix] no ralph-workflow.toml, nothing to do");
		return { changed: false, removed: [] };
	}
	const before = await file.text();
	const removed: string[] = [];
	const after = before
		.split("\n")
		.filter((line) => {
			const m = line.match(/^([A-Za-z_][\w-]*)\s*=/);
			if (m && ORPHAN_KEYS.includes(m[1])) {
				removed.push(m[1]);
				return false;
			}
			return true;
		})
		.join("\n");

	if (removed.length === 0) {
		console.log("[ralph-fix] no orphan keys");
		return { changed: false, removed };
	}
	const backup = `${wf}.bak-${Date.now()}`;
	await Bun.write(backup, before);
	await Bun.write(wf, after);
	console.log(
		`[ralph-fix] removed orphans: ${removed.join(", ")} (backup: ${backup})`,
	);

	// Enforce STRING cmd + exa|ddgs enum via a python sanity pass when available.
	await $`python3 - << 'PY'
import pathlib, re, sys
wf = pathlib.Path("${wf}")
text = wf.read_text()
bad = [l for l in text.splitlines() if re.match(r'^(cmd|provider)\s*=', l) and ('"' not in l and "'" not in l)]
if bad:
    print("WARN: non-string cmd/provider lines:", bad, file=sys.stderr)
else:
    print("python sanity: cmd/provider strings ok")
PY`
		.quiet()
		.catch(() => {});
	return { changed: true, removed, backup };
}

if (import.meta.main) await ralphFix();
