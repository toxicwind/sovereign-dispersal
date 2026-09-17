// Sovereign FS-Map: audit the big local trees (sovereign/, projects/),
// count symlinks, spot duplicate top-level names across roots, and
// persist the map to ~/.config/sovereign-fs-map.json.

import type { Dirent } from "node:fs";
import { readdir } from "node:fs/promises";
import os from "node:os";
import { join } from "node:path";

export type FsRoot = { path: string; top: string[]; entries: number };
export type DupPair = {
	a: string;
	b: string;
	overlap: string[];
	count: number;
};
export type FsMap = {
	generatedAt: string;
	roots: FsRoot[];
	dupPairs: DupPair[];
	symlinks: number;
	gitRepos: number;
};

const DEFAULT_ROOTS = [
	"sovereign",
	"projects",
	"projects/sovereign-projects/tau",
];

export async function auditFsMap(home = os.homedir()): Promise<FsMap> {
	const roots = DEFAULT_ROOTS.map((r) => join(home, r));
	const topDirs = new Map<string, string[]>();
	const fsMap: FsMap = {
		generatedAt: new Date().toISOString(),
		roots: [],
		dupPairs: [],
		symlinks: 0,
		gitRepos: 0,
	};

	for (const r of roots) {
		let entries: Dirent[] | undefined;
		try {
			entries = await readdir(r, { withFileTypes: true });
		} catch {
			continue; // root absent on this machine — not an error
		}
		const top: string[] = [];
		for (const e of entries) {
			if (e.isSymbolicLink()) {
				fsMap.symlinks++;
				continue;
			}
			if (e.isDirectory()) {
				top.push(e.name);
				if (e.name === ".git") fsMap.gitRepos++;
			}
		}
		top.sort();
		topDirs.set(r, top);
		fsMap.roots.push({
			path: r,
			top: top.slice(0, 20),
			entries: entries.length,
		});
	}

	const paths = [...topDirs.keys()];
	for (let i = 0; i < paths.length; i++) {
		for (let j = i + 1; j < paths.length; j++) {
			const a = new Set(topDirs.get(paths[i]) ?? []);
			const overlap = (topDirs.get(paths[j]) ?? []).filter((x) => a.has(x));
			if (overlap.length > 0) {
				fsMap.dupPairs.push({
					a: paths[i],
					b: paths[j],
					overlap,
					count: overlap.length,
				});
			}
		}
	}

	await Bun.write(
		join(home, ".config", "sovereign-fs-map.json"),
		JSON.stringify(fsMap, null, 2),
	);
	return fsMap;
}

if (import.meta.main) {
	const m = await auditFsMap();
	console.log(
		`fs-map: ${m.roots.length} roots, ${m.dupPairs.length} dup pairs, ${m.symlinks} symlinks, ${m.gitRepos} git repos`,
	);
}
