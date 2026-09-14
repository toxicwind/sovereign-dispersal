import { expect, test } from "bun:test";
import {
	AllProbesFailed,
	fastestWins,
	probeOnce,
} from "../src/transport/fastest-wins.ts";

// Offline-safe: race against a local Bun server instead of the internet.
async function withLocalServer(fn: (port: number) => Promise<void>) {
	const server = Bun.serve({ port: 0, fetch: () => new Response("ok") });
	try {
		await fn(server.port);
	} finally {
		server.stop();
	}
}

test("fastest-wins picks the open local port", async () => {
	await withLocalServer(async (port) => {
		const win = await fastestWins([{ host: "127.0.0.1", ports: [port] }]);
		expect(win.host).toBe("127.0.0.1");
		expect(win.port).toBe(port);
		expect(win.ms).toBeGreaterThanOrEqual(0);
	});
});

test("fastest-wins ignores a fast failure and takes the slower success", async () => {
	await withLocalServer(async (port) => {
		// 127.0.0.1:1 refuses instantly; the real server must still win.
		const win = await fastestWins([
			{ host: "127.0.0.1", ports: [1] },
			{ host: "127.0.0.1", ports: [port] },
		]);
		expect(win.port).toBe(port);
	});
});

test("fastest-wins rejects only when every probe fails", async () => {
	const err = await fastestWins(
		[{ host: "127.0.0.1", ports: [1, 2] }],
		3000,
	).catch((e) => e);
	expect(err).toBeInstanceOf(AllProbesFailed);
});

test("probeOnce reports the target it dialed", async () => {
	await withLocalServer(async (port) => {
		const controller = new AbortController();
		const w = await probeOnce(
			"localhost",
			port,
			controller.signal,
			"127.0.0.1",
		);
		expect(w.target).toBe("127.0.0.1");
		expect(w.port).toBe(port);
	});
});
