// Fastest-wins transport: race TCP probes, first OPEN socket wins,
// the rest are cancelled. Rejection-tolerant — a fast failure never
// beats a slower success; only rejects when every probe fails.

export type Probe = { host: string; ip?: string; ports: number[] };
export type Win = { host: string; port: number; ms: number; target: string };

export class AllProbesFailed extends Error {
	failures: string[];
	constructor(failures: string[]) {
		super(
			`all ${failures.length} probes failed: ${failures.slice(0, 3).join("; ")}`,
		);
		this.name = "AllProbesFailed";
		this.failures = failures;
	}
}

export async function probeOnce(
	host: string,
	port: number,
	signal: AbortSignal,
	ip?: string,
): Promise<Win> {
	const target = ip || host;
	const t0 = Date.now();
	return new Promise<Win>((resolve, reject) => {
		if (signal.aborted) return reject(new Error("aborted"));
		let settled = false;
		const onAbort = () => {
			if (!settled) {
				settled = true;
				reject(new Error("aborted"));
			}
		};
		signal.addEventListener("abort", onAbort, { once: true });
		const done = (fn: () => void) => {
			if (!settled) {
				settled = true;
				signal.removeEventListener("abort", onAbort);
				fn();
			}
		};
		const opts: Parameters<typeof Bun.connect>[0] = {
			hostname: target,
			port,
			socket: {
				open(socket) {
					done(() => {
						resolve({ host, port, ms: Date.now() - t0, target });
						socket.end();
					});
				},
				error() {
					done(() => reject(new Error(`fail ${target}:${port}`)));
				},
				data() {},
			},
		};
		Bun.connect(opts).catch((err: unknown) => {
			done(() =>
				reject(
					err instanceof Error ? err : new Error(`fail ${target}:${port}`),
				),
			);
		});
	});
}

export async function fastestWins(
	probes: Probe[],
	timeoutMs = 8000,
): Promise<Win> {
	const controller = new AbortController();
	const start = Date.now();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const tasks = probes.flatMap((p) =>
			p.ports.map((port) => probeOnce(p.host, port, controller.signal, p.ip)),
		);
		// First SUCCESS wins — failures are swallowed until every probe fails.
		const win = await Promise.any(tasks);
		return { ...win, ms: Date.now() - start };
	} catch (err) {
		if (err instanceof AggregateError) {
			throw new AllProbesFailed(err.errors.map(String));
		}
		throw err;
	} finally {
		clearTimeout(timer);
		controller.abort(); // cancel the rest
	}
}

if (import.meta.main) {
	const win = await fastestWins([{ host: "8.8.8.8", ports: [80] }]);
	console.log(
		`fastest-wins: ${win.host}:${win.port} target=${win.target} ${win.ms}ms`,
	);
}
