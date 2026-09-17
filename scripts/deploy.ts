// Deploy: build the bun bundle, then build + optionally push the Docker
// image. Edge distribution (Fastly / Comcast Qwilt Open Edge) and the Modal
// bucket mount are documented in README — this script handles the artifact.

import { $ } from "bun";

const IMAGE = process.env.DEPLOY_IMAGE ?? "sovereign-dispersal:latest";
const PUSH = process.env.DEPLOY_PUSH === "1";

console.log("=== sovereign-dispersal deploy ===");

console.log("[1/3] bun build");
await $`bun build src/index.ts --outdir dist --target bun`;

console.log("[2/3] docker build");
try {
	await $`docker build -t ${IMAGE} .`;
	console.log(`built ${IMAGE}`);
} catch {
	console.error("docker build failed — is docker running?");
	process.exit(1);
}

if (PUSH) {
	console.log("[3/3] docker push");
	await $`docker push ${IMAGE}`;
	console.log(`pushed ${IMAGE}`);
} else {
	console.log("[3/3] push skipped (set DEPLOY_PUSH=1 to push)");
}

console.log(
	"Edge: distribute via Fastly / Comcast Qwilt Open Edge; mount data with Modal CloudBucketMount at /mnt/s3/my-data (see README).",
);
