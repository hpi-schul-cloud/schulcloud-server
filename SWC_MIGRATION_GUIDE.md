# SWC Migration Guide (Jest + NestJS + MikroORM)

This guide summarizes what we learned while migrating tests from `ts-jest` to `@swc/jest` in this repository.

## Why this matters

SWC is much faster than `ts-jest`, but it can expose runtime assumptions that previously went unnoticed.

Typical risk areas:
- Decorator metadata and reflection (MikroORM/Nest)
- Entity inheritance and class field initialization order
- Circular imports between entities/modules
- `undefined`/`null` handling in transformers and merge logic
- Assigning ORM entities with protected id fields

## Migration baseline

- Jest transform switched to `@swc/jest`
- SWC config enabled decorators and metadata
- CommonJS module output used for Jest compatibility

## Scope decision (Phase 1)

Phase 1 in this repository means:
- SWC is used for Jest test transpilation.
- Nest build/runtime compiler stays unchanged (TypeScript pipeline via current Nest CLI setup).

What this phase is intentionally not doing:
- no switch of production build/start pipeline to SWC
- no monorepo build reconfiguration for SWC runtime bundles

Rationale:
- keeps migration risk lower while capturing most developer feedback quickly in tests
- allows runtime-hardening fixes to land incrementally before touching production build compiler

## Phase 1 exit criteria

Treat phase 1 as done when:
1. Representative API/feature waves are green under Jest+SWC.
2. Regressions introduced by SWC semantics are fixed with targeted tests.
3. Remaining warnings are documented and triaged (blocking vs non-blocking).
4. Team guidance for SWC-safe coding is available (this document + PR checklist).

## Core coding rules for new code

### 1. Prefer explicit runtime metadata in entities

If runtime behavior depends on type metadata, do not rely only on TypeScript inference.

Use explicit decorator config for:
- enums in embeddables/entities
- special scalar mappings
- polymorphic or discriminator-related fields

Example:

```ts
@Enum({ items: () => CustomParameterScope })
scope: CustomParameterScope;
```

### 2. Write relations in a cycle-safe way

For entity relations prone to circular imports:
- prefer string entity names in relation decorators
- use type-only imports where possible

Example:

```ts
import type { SchoolEntity } from '@modules/school/repo/school.entity';

@ManyToOne('SchoolEntity')
school: SchoolEntity;
```

### 3. Do not assign id fields during updates

In update paths (`em.assign`), never pass payloads containing id internals if they may be `undefined`.

- strip `id`/`_id` fields before assign
- assign plain mapped props, not full entity instances

Example:

```ts
const updateProps = mapDomainToEntityProps(domain);
delete updateProps.id;
entity = em.assign(existing, updateProps);
```

### 4. Be careful with class inheritance + constructors

In discriminator hierarchies, explicitly set critical fields in subclass constructors after `super(...)`.

This prevents cases where subclass field initialization or transpilation order effectively drops values.

### 5. Handle undefined/null explicitly in utility code

Transformers and config mergers should treat `undefined` and `null` intentionally.

- avoid implicit object-key merges that include `undefined`
- return early for optional transformer values when appropriate

### 6. Avoid deep merge on getter-only models

Factory/deep-merge tools can try to assign properties that only expose getters.

If a model needs to be mutable in tests/builders, provide matching setters or avoid deep merge into that shape.

## Recommended PR checklist (SWC-safe)

Before merging, verify:

1. Any decorator-driven field that needs runtime typing is explicit.
2. Relation declarations are cycle-safe (string refs/type imports where needed).
3. Update code does not assign `id`/`_id` accidentally.
4. Constructor logic in inherited entities keeps required fields set.
5. Transformer/merge logic is explicit about `undefined`/`null`.
6. Added tests cover persistence outcomes, not only HTTP status.

## Suggested migration workflow for larger modules

1. Switch transpiler/config first.
2. Run a small representative smoke test wave.
3. Fix metadata/ORM runtime issues.
4. Expand to broader waves and isolate new blockers by domain.
5. Add targeted regression tests for each fixed blocker.
6. Remove temporary diagnostics once stable.

## Known symptom -> likely cause mapping

- `Value for <Entity>.<field> is required, 'undefined' found`
  - constructor/field initialization order issue
  - missing explicit assignment after `super(...)`
  - missing or weak runtime metadata

- `You must pass a non-undefined value to property _id`
  - update path assigning id fields with `undefined`
  - direct `em.assign` with unsafe payload/entity instance

- API tests show many `POST /authentication/local` 500 errors
  - usually downstream symptom of shared runtime/persistence failures
  - investigate earlier entity/runtime errors in same run

- strict-mode or property assignment errors in tests/factories
  - deep merge into getter-only shapes
  - incompatible runtime assumptions in builder objects

## Final recommendation

Treat SWC migration as a runtime-hardening effort, not only a build-speed change.

The most reliable pattern is:
- explicit metadata
- explicit relation targets
- explicit update payloads
- explicit null/undefined behavior

## Benchmark decision snapshot (Phase 1)

Use the matched Node 24 full-suite rerun as the decision baseline.

- Baseline (pre-SWC) wall-clock: `260.96 s`
- Current (SWC) wall-clock: `356.04 s`
- Delta: `+95.08 s` (`+36.4%` slower)

Functional outcome in the fairness rerun:

- Current SWC run had no failed test suites (`1157 passed`, `3 skipped`).
- Non-zero exit came from coverage thresholds, not suite failures.

Medium shared-subset trial (last-step decision check):

- Shared API subset size: `55` specs (green/green on both branches).
- Current SWC: `55/55` suites passed, Jest time `157.823 s`.
- Baseline pre-SWC: `55/55` suites passed, Jest time `144.312 s`.

Move-on decision:

- Hold: do not proceed with broad SWC rollout yet.
- Why: while targeted trials are green, broader stability/performance confidence is still insufficient.
- Current state: no end-to-end runtime win is demonstrated; full-suite and medium-scope comparisons remain slower.
- Next: continue with focused stabilization/performance work and reassess only after agreed exit criteria are met.
