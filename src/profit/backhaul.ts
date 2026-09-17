// Empty-backhaul profit oracle: model the EBITDA lift from buying empty
// return legs at a discount. `before` is the baseline brokerage EBITDA %;
// the lift comes from the discount leverage plus the safety/confidentiality
// premium private fleets command.

import { z } from "zod";

export const BackhaulInput = z.object({
	lanes: z.number().int().positive(),
	trucks: z.number().int().positive(),
	discount: z.number().min(0).max(0.9),
	baseEbitda: z.number().positive().default(2.5),
	premium: z.number().positive().default(2.2),
});
export type BackhaulInput = z.infer<typeof BackhaulInput>;

export type BackhaulResult = {
	lanes: number;
	trucks: number;
	discount: number;
	before: number;
	after: number;
	lift: number;
};

export function backhaulProfit(input: unknown): BackhaulResult {
	const { lanes, trucks, discount, baseEbitda, premium } =
		BackhaulInput.parse(input);
	const after = baseEbitda * (1 / (1 - discount)) * premium;
	return {
		lanes,
		trucks,
		discount,
		before: baseEbitda,
		after: Number(after.toFixed(2)),
		lift: Number((after / baseEbitda).toFixed(2)),
	};
}

if (import.meta.main) {
	console.log(backhaulProfit({ lanes: 40000, trucks: 80000, discount: 0.25 }));
}
