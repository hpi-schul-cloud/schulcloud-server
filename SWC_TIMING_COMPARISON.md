# SWC Timing Comparison

## Decision

- Hold decision: do not proceed with broad SWC rollout yet.
- Basis: although selected fairness/subset runs are stable, wider-suite runs still show instability/noise in this migration phase.
- Performance outcome: no end-to-end speedup is demonstrated; measured full-suite and medium-scope comparisons remain slower than baseline.
- Tooling concern: keep architecture/toolchain scope minimal until performance and stability goals are met.
- Exit criteria to revisit decision:
	- repeatable green wider-suite runs,
	- no meaningful runtime regression versus baseline,
	- agreed low-friction build/tooling path.

This file contains the cleaned benchmark record for the latest apples-to-apples rerun.

## Benchmark Setup

- Current branch (SWC): `9bc3953c2`
- Baseline branch (pre-SWC): `57133c8af`
- Runtime on both sides: Node `24.15.0`, npm `11.12.1`
- Command on both sides: `npm test`
- Memory on both sides: `NODE_OPTIONS=--max-old-space-size=8192`

## Baseline (pre-SWC)

- Exit: `0`
- Jest time: `252.801 s`
- Wall-clock (`time -p real`): `260.96 s`
- Test suites: `3 skipped, 1169 passed, 1169 of 1172 total`
- Tests: `11 skipped, 9 todo, 9203 passed, 9223 total`

## Current (SWC) - Initial Full Run

- Exit: `1`
- Jest time: `399.312 s`
- Wall-clock (`time -p real`): `401.41 s`
- Test suites: `1 failed, 3 skipped, 1156 passed, 1157 of 1160 total`
- Tests: `1 failed, 13 skipped, 9 todo, 9764 passed, 9787 total`
- Failing suite: `apps/server/src/modules/board/controller/api-test/column-move.api.spec.ts` (timeout)

## Fairness Check for Flaky Timeout

Repeated single-suite reruns of `column-move.api.spec.ts`:

- Run 1: passed (`3/3` tests), `5.493 s`
- Run 2: passed (`3/3` tests), `4.124 s`
- Run 3: passed (`3/3` tests), `3.664 s`

Conclusion: timeout failure is flaky; suite was stable in immediate reruns.

## Current (SWC) - Fairness Full Rerun

- Exit: `1` (coverage thresholds), not suite failures
- Jest time: `354.511 s`
- Wall-clock (`time -p real`): `356.04 s`
- Test suites: `3 skipped, 1157 passed, 1157 of 1160 total`
- Tests: `13 skipped, 9 todo, 9765 passed, 9787 total`

## Apples-to-Apples Delta (Fair Rerun vs Baseline)

- Baseline real: `260.96 s`
- Current real: `356.04 s`
- Absolute delta: `+95.08 s`
- Relative delta: `+36.4%` slower than baseline

## Notes

- Current run exits non-zero due to strict global coverage thresholds in the test command.
- For pure runtime benchmarking, use an equivalent command without coverage gating on both branches.

## No-Coverage Shared Subset Benchmark (Green/Green)

Subset used (shared files on both branches):

- `apps/server/src/apps/helpers/app-start-loggable.spec.ts`
- `apps/server/src/modules/provisioning/domain/error/invalid-laufzeit-response.loggable-exception.spec.ts`
- `apps/server/src/shared/common/utils/promise.spec.ts`
- `apps/server/src/shared/common/validator/string.validator.spec.ts`
- `apps/server/src/shared/domain/interface/base-domain-object.spec.ts`
- `apps/server/src/core/error/dto/validation-error-detail.response.spec.ts`
- `apps/server/src/modules/health/domain/health-status-check.do.spec.ts`

Settings:

- Runtime on both sides: Node `24.15.0`, npm `11.12.1`
- Command style: `npx jest --runInBand <same-spec-list>`
- Memory: `NODE_OPTIONS=--max-old-space-size=8192`
- Iterations per side: `3`

Current (SWC) runs:

- Run 1: `real 2.08 s`
- Run 2: `real 1.47 s`
- Run 3: `real 1.48 s`
- Median: `1.48 s`
- Status: `7/7 suites passed`, `30/30 tests passed`

Baseline (pre-SWC) runs:

- Run 1: `real 8.05 s`
- Run 2: `real 7.06 s`
- Run 3: `real 7.38 s`
- Median: `7.38 s`
- Status: `7/7 suites passed`, `30/30 tests passed`

Subset delta (median):

- Absolute improvement: `5.90 s` faster on SWC
- Relative improvement: about `80%` faster on this stable subset

Interpretation:

- Full-suite fair rerun currently shows a runtime regression (`+36.4%` slower).
- Green/green no-coverage subset shows strong transpilation/runtime speedup with SWC.
- Read together: SWC can be faster in stable slices, while full-suite overhead/regressions still need optimization.

## Medium Shared Subset Trial (Last-Step Decision Check)

Subset basis:

- Built from shared board/room/sharing/system API spec intersection across current and baseline.
- Started from `56` shared specs, then excluded known unstable `room-change-role.api.spec.ts`.
- Final medium subset size: `55` specs.

Results (single matched run, no coverage):

- Current (SWC):
	- `55/55` suites passed
	- `460 passed`, `2 skipped` tests (`462 total`)
	- Jest time: `157.823 s`
- Baseline (pre-SWC):
	- `55/55` suites passed
	- `400 passed` tests (`400 total`)
	- Jest time: `144.312 s`
	- Wall-clock (`time -p real`): `150.42 s`

Medium-trial interpretation:

- This larger green/green trial confirms functional comparability on a broader scope than the 7-spec subset.
- Runtime on this medium subset is still slower on current SWC (about `+13.5 s` by Jest time).
- Combined decision signal remains: move forward with SWC Phase 1 for correctness/stability, while opening explicit performance follow-up tasks.