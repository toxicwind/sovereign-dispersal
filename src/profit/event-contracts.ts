// Event Contracts as fastest-wins substrate - HYPE $80.6937 15-min window
// From screenshots: CF Benchmarks HYPEUSDRTI 60-sec avg before 1:30 vs 1:15 PM EDT Sep14 2026
// Settlement: $1 if Yes else $0, prices in cents = probability, open interest underneath
// Fees: up to $0.01 per contract + exchange fee, IOC order, fully collateralized, no margin

export type HYPEMarket = {
	target: number;
	windowStart: string;
	windowEnd: string;
	source: "CF Benchmarks HYPEUSDRTI";
	settlement: "avg 60 RTI prices last minute, rounded 4 decimals";
};

export const hypeMarket: HYPEMarket = {
	target: 80.6937,
	windowStart: "1:15 PM EDT Sep 14 2026",
	windowEnd: "1:30 PM EDT Sep 14 2026",
	source: "CF Benchmarks HYPEUSDRTI",
	settlement: "avg 60 RTI prices last minute, rounded 4 decimals",
};

export function isTradingProhibited(person: {
	employedBySourceAgency: boolean;
	hasMaterialNonPublic: boolean;
}) {
	return person.employedBySourceAgency || person.hasMaterialNonPublic;
}

export function resolveMarket(
	avgBeforeEnd: number,
	avgBeforeStart: number,
): "Yes" | "No" {
	return avgBeforeEnd >= avgBeforeStart ? "Yes" : "No";
}

export function priceToProb(cents: number) {
	return cents / 100; // 46c = 46% per FAQ
}

if (import.meta.main) {
	console.log(hypeMarket);
	console.log("46c =", priceToProb(46), "Up 46c vs Down 56c from screenshot");
	console.log(
		"99.9c nearly certain - open interest is number underneath names",
	);
}
