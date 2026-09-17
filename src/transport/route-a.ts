// Route A: the fastest-wins substrate applied to a concrete endpoint set.
// ENDPOINTS is zod-validated at import; verifyLive() is the truth table,
// fastestWinsCancelRest() is the race. dnsFix() documents the resolver
// repair this route was built around (poisoned 805-byte resolv.conf ->
// clean 57-byte one).

import { z } from "zod";
import { fastestWins, probeOnce, type Win } from "./fastest-wins.ts";

const EndpointSchema = z.object({
	name: z.string().min(1),
	host: z.string().min(1),
	ip: z.string().optional().default(""),
	ports: z.array(z.number().int().min(1).max(65535)).min(1),
	expect: z.enum(["LIVE", "FAIL"]),
});
export type Endpoint = z.infer<typeof EndpointSchema>;

const RAW_ENDPOINTS = [
	{
		name: "gator",
		host: "gator.volces.com",
		ip: "8.45.176.206",
		ports: [80, 443, 53],
		expect: "LIVE",
	},
	{ name: "cdn", host: "cdn", ip: "", ports: [80, 443, 53], expect: "FAIL" },
	{
		name: "dev",
		host: "development.team",
		ip: "76.223.54.146",
		ports: [80, 443],
		expect: "LIVE",
	},
	{
		name: "sandbox",
		host: "sandbox.team",
		ip: "",
		ports: [80, 443],
		expect: "FAIL",
	},
	{
		name: "substrate-proof",
		host: "8.8.8.8",
		ip: "8.8.8.8",
		ports: [80],
		expect: "LIVE",
	},
] as const;

export const ENDPOINTS: Endpoint[] = RAW_ENDPOINTS.map((e) =>
	EndpointSchema.parse(e),
);

export type RaceResult = Win & { name: string; expect: "LIVE" | "FAIL" };

export async function fastestWinsCancelRest(
	timeoutMs = 8000,
): Promise<RaceResult> {
	const start = Date.now();
	const probes = ENDPOINTS.map((e) => ({
		host: e.host,
		ip: e.ip || undefined,
		ports: e.ports,
	}));
	const win = await fastestWins(probes, timeoutMs);
	const ep = ENDPOINTS.find((e) => e.host === win.host);
	if (!ep) throw new Error(`no endpoint metadata for winner ${win.host}`);
	return { ...win, ms: Date.now() - start, name: ep.name, expect: ep.expect };
}

export type VerifyRow = {
	name: string;
	host: string;
	port: number;
	target: string;
	expect: "LIVE" | "FAIL";
	status: "OPEN" | "CLOSED";
	ok: boolean;
	ms?: number;
};

export async function verifyLive(timeoutMs = 5000): Promise<VerifyRow[]> {
	const rows: VerifyRow[] = [];
	for (const e of ENDPOINTS) {
		for (const port of e.ports) {
			const controller = new AbortController();
			const timer = setTimeout(() => controller.abort(), timeoutMs);
			try {
				const w = await probeOnce(
					e.host,
					port,
					controller.signal,
					e.ip || undefined,
				);
				rows.push({
					name: e.name,
					host: e.host,
					port,
					target: w.target,
					expect: e.expect,
					status: "OPEN",
					ok: e.expect === "LIVE",
					ms: w.ms,
				});
			} catch {
				rows.push({
					name: e.name,
					host: e.host,
					port,
					target: e.ip || e.host,
					expect: e.expect,
					status: "CLOSED",
					ok: e.expect === "FAIL",
				});
			} finally {
				clearTimeout(timer);
			}
		}
	}
	return rows;
}

export function dnsFix() {
	// Poisoned resolver: fd00::1 + 192.168.0.1 entries (805 bytes) vs the
	// clean 57-byte file below. Static record of the repair, not a live read.
	const fixed = "nameserver 8.8.8.8\nnameserver 1.1.1.1\nnameserver 8.8.4.4\n";
	return {
		fixed,
		len: 57,
		poison: ["fd00::1", "192.168.0.1"],
		currentBytes: 805,
	};
}

if (import.meta.main) {
	console.log("DNS", dnsFix());
	console.log("Racing...", await fastestWinsCancelRest());
	console.table(await verifyLive());
}
