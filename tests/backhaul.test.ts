import { expect, test } from "bun:test";
import { BackhaulInput, backhaulProfit } from "../src/profit/backhaul.ts";

test("backhaul EBITDA lift beats 2.5x at 25% discount", () => {
	const p = backhaulProfit({ lanes: 40000, trucks: 80000, discount: 0.25 });
	expect(p.lift).toBeGreaterThan(2.5);
	expect(p.lift).toBeCloseTo(2.93, 1);
	expect(p.after).toBeGreaterThan(p.before);
	expect(p.before).toBe(2.5);
});

test("backhaul rejects invalid input", () => {
	expect(() =>
		backhaulProfit({ lanes: -1, trucks: 10, discount: 0.25 }),
	).toThrow();
	expect(() =>
		backhaulProfit({ lanes: 10, trucks: 10, discount: 1.5 }),
	).toThrow();
	expect(() =>
		BackhaulInput.parse({ lanes: 10, trucks: 10, discount: 0.1 }),
	).toBeTruthy();
});

test("backhaul zero discount still carries the premium", () => {
	const p = backhaulProfit({ lanes: 1000, trucks: 2000, discount: 0 });
	expect(p.lift).toBeCloseTo(2.2, 5);
});
