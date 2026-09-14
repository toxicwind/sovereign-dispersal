import { expect, test } from "bun:test";
import { avoLoop } from "../src/profit/avo.ts";
import {
	isTradingProhibited,
	priceToProb,
	resolveMarket,
} from "../src/profit/event-contracts.ts";
import { dnsFix, ENDPOINTS, verifyLive } from "../src/transport/route-a.ts";

test("route-a endpoints are valid and cover live+fail expectations", () => {
	expect(ENDPOINTS.length).toBe(5);
	expect(ENDPOINTS.filter((e) => e.expect === "LIVE").length).toBe(3);
	expect(ENDPOINTS.filter((e) => e.expect === "FAIL").length).toBe(2);
	for (const e of ENDPOINTS) {
		expect(e.ports.length).toBeGreaterThan(0);
	}
});

test("dnsFix returns the documented 57-byte resolver", () => {
	const d = dnsFix();
	expect(d.len).toBe(57);
	expect(d.fixed).toContain("nameserver 8.8.8.8");
	expect(d.poison).toContain("fd00::1");
});

test("verifyLive truth table is self-consistent", async () => {
	// Network behavior varies (this sandbox transparently opens everything),
	// so assert the invariant instead of specific outcomes: ok must equal
	// "observed status matches the expectation".
	const rows = await verifyLive(2000);
	expect(rows.length).toBeGreaterThan(0);
	for (const r of rows) {
		expect(["OPEN", "CLOSED"]).toContain(r.status);
		expect(r.ok).toBe((r.status === "OPEN") === (r.expect === "LIVE"));
	}
	// every endpoint contributes at least one row
	for (const e of ENDPOINTS) {
		expect(rows.some((r) => r.name === e.name)).toBe(true);
	}
}, 30000);

test("avo loop is deterministic with a seed", async () => {
	const a = await avoLoop({ envs: 2, levels: 6, seed: 42 });
	const b = await avoLoop({ envs: 2, levels: 6, seed: 42 });
	expect(a.actions).toBe(b.actions);
	expect(a.completed).toBe(12);
	expect(a.memory.visual.length + a.memory.reasoning.length).toBe(12);
});

test("event contracts math", () => {
	expect(priceToProb(46)).toBeCloseTo(0.46, 10);
	expect(resolveMarket(80.7, 80.6)).toBe("Yes");
	expect(resolveMarket(80.5, 80.6)).toBe("No");
	expect(
		isTradingProhibited({
			employedBySourceAgency: true,
			hasMaterialNonPublic: false,
		}),
	).toBe(true);
	expect(
		isTradingProhibited({
			employedBySourceAgency: false,
			hasMaterialNonPublic: false,
		}),
	).toBe(false);
});
