# Technical Handover: Runtime Configuration Module

## Document Purpose & Structure

This document is a technical handover for the NestJS runtime configuration module. It is intended to support a workshop presentation and to serve as a post-session summary for participants.

The structure follows a practical learning flow: concept and scope -> architecture -> domain model -> persistence -> API usage -> integration example -> known behaviors/gotchas -> exploration order.

---

## 1. Overview & Purpose

### 1.1 Problem This Module Solves

The runtime configuration module stores selected configuration values in the database so they can be changed at runtime without waiting for deployment/release cycles.

Typical use cases:
- Feature toggles
- Operational switches during incidents or migrations
- Runtime text/content that support teams may need to adjust quickly

### 1.2 Scope Boundaries

This handover describes the NestJS runtime config implementation only:
- Infrastructure module in `apps/server/src/infra/runtime-config`
- API module in `apps/server/src/modules/runtime-config-api`
- Typical consumption in NestJS application code

---

## 2. High-Level Architecture

### 2.1 Building Blocks

- **Defaults definition** (source-of-truth list of allowed keys and types)
- **Domain object** with type-safe value handling and parsing
- **Repository** that overlays persisted DB values on top of defaults
- **API layer** for listing and updating runtime values
- **Consumers** that read typed values (`getBoolean`, `getNumber`, `getString`) at runtime

### 2.2 Runtime Flow

```text
┌──────────────────────────────────────────────────────────────┐
│ Defaults (code)                                               │
│ runtime-config-defaults.ts                                    │
└──────────────────────────────┬───────────────────────────────┘
                               │ RuntimeConfigModule.forRoot()
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ RuntimeConfigService                                          │
│ - findAll()                                                    │
│ - getByKey()                                                   │
│ - getString()/getNumber()/getBoolean()                        │
│ - save()                                                       │
└──────────────────────────────┬───────────────────────────────┘
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ RuntimeConfigMikroOrmRepo                                     │
│ - reads entity by key / all                                   │
│ - maps entity <-> domain object                               │
│ - falls back to default when no DB row exists                 │
└──────────────────────────────┬───────────────────────────────┘
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ MongoDB collection: runtimeconfigs                            │
│ key (unique), type, value (stored as string), description?    │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Module Wiring and Dependency Injection

### 3.1 Infra Module Registration

📁 [runtime-config.module.ts](../apps/server/src/infra/runtime-config/runtime-config.module.ts)

The module is configured dynamically:

```typescript
RuntimeConfigModule.forRoot({ defaults: RuntimeConfigDefaults })
```

It registers:
- `RuntimeConfigService`
- `RUNTIME_CONFIG_DEFAULTS` token with `useValue: defaults`
- `RUNTIME_CONFIG_REPO` token with `useClass: RuntimeConfigMikroOrmRepo`

### 3.2 Injection Tokens

📁 [injection-keys.ts](../apps/server/src/infra/runtime-config/injection-keys.ts)

- `RUNTIME_CONFIG_DEFAULTS`
- `RUNTIME_CONFIG_REPO`

These decouple the service from concrete repository/default implementations.

### 3.3 Runtime Config API Module Composition

📁 [runtime-config-api.module.ts](../apps/server/src/modules/runtime-config-api/runtime-config-api.module.ts)
📁 [server-runtime-config.module.ts](../apps/server/src/modules/runtime-config-api/server-runtime-config.module.ts)

- `ServerRuntimeConfigModule` imports `RuntimeConfigModule.forRoot({ defaults })`
- `RuntimeConfigApiModule` adds controller/UC and imports auth + logger modules

---

## 4. Defaults: Allowed Keys, Types, and Baseline Values

### 4.1 Defaults File

📁 [runtime-config-defaults.ts](../apps/server/src/modules/runtime-config-api/runtime-config-defaults.ts)

This file defines all supported runtime-config keys.

Each default has:
- `key`
- `type` (`string` | `number` | `boolean`)
- `value` (initial/default)
- optional `description` (shown in UI context)

Current examples include:
- `DASHBOARD_ANNOUNCEMENT_*` keys for dashboard announcement behavior and content
- `IS_SCHOOL_YEAR_CHANGE_ACTIVE` for TSP synchronization control

### 4.2 Important Rule

Only keys defined in defaults are considered valid by the runtime-config infrastructure.

---

## 5. Domain Model and Type Handling

### 5.1 Domain Object

📁 [runtime-config-value.do.ts](../apps/server/src/infra/runtime-config/domain/runtime-config-value.do.ts)

The central domain object is `RuntimeConfigValue`.

Type model:
- `RuntimeConfigValueAndType` union:
  - `{ type: 'string', value: string }`
  - `{ type: 'number', value: number }`
  - `{ type: 'boolean', value: boolean }`

### 5.2 Value Mutation Methods

- `setValue(value: string | number | boolean)`
  - Strict runtime type match required
  - Throws if type does not match
- `setValueFromString(value: string)`
  - Parses according to configured type
  - Used by API update flow (PATCH receives string input)

### 5.3 String Sanitization Behavior

String values are sanitized with:
- `sanitizeRichText(..., InputFormat.RICH_TEXT_CK5)`

This applies in both `setValue` and `setValueFromString` for string-typed keys.

### 5.4 Domain-Level Error Types

📁 [runtime-config-value-invalid-type.loggable.ts](../apps/server/src/infra/runtime-config/domain/loggable/runtime-config-value-invalid-type.loggable.ts)
📁 [runtime-config-not-expected-type.loggable.ts](../apps/server/src/infra/runtime-config/domain/loggable/runtime-config-not-expected-type.loggable.ts)

- `RuntimeConfigValueInvalidTypeLoggable` (BadRequest)
  - thrown when incoming value cannot match/parse to configured type
- `RuntimeConfigValueNotExpectedType` (InternalServerErrorException)
  - thrown when typed service getter (e.g. `getBoolean`) encounters a different stored type

Both are loggable exceptions and therefore integrate with the global error pipeline.

---

## 6. Persistence Model and Mapping

### 6.1 Entity

📁 [runtime-config.entity.ts](../apps/server/src/infra/runtime-config/repo/entity/runtime-config.entity.ts)

Mongo entity (`runtimeconfigs`) fields:
- `key: string` (unique)
- `type: RuntimeConfigType`
- `value: string` (always persisted as string)
- `description?: string`

### 6.2 Mapper

📁 [runtime-config.entity-mapper.ts](../apps/server/src/infra/runtime-config/repo/runtime-config.entity-mapper.ts)

- `toDomainObject(entity, defaultConfig)`
  - converts persisted string value to typed domain value by `entity.type`
- `toEntityProperties(domainObject)`
  - converts typed domain value back to string via `toString()` for persistence

Data consistency errors throw:
- `RuntimeConfigValueInvalidDataLoggable`

📁 [runtime-config-invalid-data.loggable.ts](../apps/server/src/infra/runtime-config/domain/loggable/runtime-config-invalid-data.loggable.ts)

### 6.3 Repository Behavior

📁 [runtime-config.repo.ts](../apps/server/src/infra/runtime-config/repo/runtime-config.repo.ts)

`RuntimeConfigMikroOrmRepo` behavior:

- `getByKey(key)`
  - reads DB entity by key
  - resolves matching default config by same key
  - if DB entity exists: maps entity to DO
  - if DB entity missing: returns a DO built from default values
- `getAll()`
  - reads all entities
  - returns values in defaults-driven order (`this.defaults.map(...)`)
  - each default key is resolved either from DB override or default fallback
- `save(do)`
  - persists mapped entity properties via base domain repo

### 6.4 Missing Default Behavior

If key is not present in defaults, repository throws:

```text
Runtime Config for key: <key> does not exist
```

This applies even when a DB record for that key exists.

---

## 7. Service API for Consumers

### 7.1 RuntimeConfigService

📁 [runtime-config.service.ts](../apps/server/src/infra/runtime-config/domain/runtime-config.service.ts)

Methods:
- `getByKey(key): Promise<RuntimeConfigValue>`
- `findAll(): Promise<RuntimeConfigValue[]>`
- `getString(key): Promise<string>`
- `getNumber(key): Promise<number>`
- `getBoolean(key): Promise<boolean>`
- `save(runtimeConfigValue): Promise<void>`

### 7.2 Type-Safe Read Pattern

Typed getters enforce expectations at runtime. Example:

- If caller asks `getBoolean('SOME_KEY')`
- and key is configured/stored as `string`
- service throws `RuntimeConfigValueNotExpectedType`

This prevents silent misuse by consumers.

---

## 8. HTTP API for Runtime Config Management

### 8.1 Controller Endpoints

📁 [runtime-config.controller.ts](../apps/server/src/modules/runtime-config-api/api/runtime-config.controller.ts)

- `GET /runtime-config`
  - requires JWT auth
  - returns list of all configured runtime values
- `PATCH /runtime-config/:key`
  - requires JWT auth
  - updates a single runtime value using body `{ value: string }`
  - returns `{ value: persistedValue }`

### 8.2 DTOs and Input Constraints

📁 [update-runtime-config-value.url.params.ts](../apps/server/src/modules/runtime-config-api/api/dto/request/update-runtime-config-value.url.params.ts)
📁 [update-runtime-config-value.body.params.ts](../apps/server/src/modules/runtime-config-api/api/dto/request/update-runtime-config-value.body.params.ts)

- `key` is string
- `value` is string (always string at API boundary)

The domain object performs actual conversion to number/boolean where needed.

### 8.3 Use Case and Authorization

📁 [runtime-config.uc.ts](../apps/server/src/modules/runtime-config-api/api/runtime-config.uc.ts)

Update flow:
1. Load current user + permissions
2. Require `Permission.INSTANCE_EDIT`
3. Load config by key
4. Call `setValueFromString(value)`
5. Save via service
6. Log update with structured loggable
7. Return persisted typed value

### 8.4 API Mapping and Responses

📁 [runtime-config.mapper.ts](../apps/server/src/modules/runtime-config-api/api/mapper/runtime-config.mapper.ts)
📁 [runtime-config-list-item.response.ts](../apps/server/src/modules/runtime-config-api/api/dto/response/runtime-config-list-item.response.ts)
📁 [runtime-config-list.response.ts](../apps/server/src/modules/runtime-config-api/api/dto/response/runtime-config-list.response.ts)

Response items expose:
- `key`
- `type`
- `value` (typed according to `type`)
- optional `description`

---

## 9. Logging Behavior in Runtime Config API

### 9.1 Update Loggable

📁 [update-runtime-config.loggable.ts](../apps/server/src/modules/runtime-config-api/api/loggable/update-runtime-config.loggable.ts)

Successful updates log at info level with:
- `userId`
- `key`
- `givenValue`
- `persistedValue`

Message is fixed:
- `Runtime config updated`

This follows the project logging approach (structured loggable objects).

---

## 10. Real Consumer Example

### 10.1 TSP Sync Runtime Switch

📁 [tsp-sync.strategy.ts](../apps/server/src/infra/sync/strategy/tsp/tsp-sync.strategy.ts)

`TspSyncStrategy.sync()` reads:
- `runtimeConfigService.getBoolean('IS_SCHOOL_YEAR_CHANGE_ACTIVE')`

If true:
- sync is skipped
- skip reason is logged

This is a concrete example of runtime behavior control without deployment changes.

---

## 11. Test Coverage and What It Verifies

### 11.1 Domain Tests

📁 [runtime-config-value.do.spec.ts](../apps/server/src/infra/runtime-config/domain/runtime-config-value.do.spec.ts)

Verifies:
- correct set/get behavior per type
- failures on invalid type assignments/parsing
- string sanitization behavior (invalid HTML/script removal)

### 11.2 Service Tests

📁 [runtime-config.service.spec.ts](../apps/server/src/infra/runtime-config/domain/runtime-config.service.spec.ts)

Verifies:
- delegation to repo
- typed getter behavior
- error behavior on type mismatch

### 11.3 Repository Tests

📁 [runtime-config.repo.spec.ts](../apps/server/src/infra/runtime-config/repo/runtime-config.repo.spec.ts)

Verifies:
- default fallback when DB row is missing
- persistence of string/number/boolean values
- `getAll()` behavior and defaults-based filtering
- error behavior for invalid DB data and unknown keys

### 11.4 API Tests

📁 [runtime-config-list.api.spec.ts](../apps/server/src/modules/runtime-config-api/api/test/runtime-config-list.api.spec.ts)
📁 [runtime-config-update.api.spec.ts](../apps/server/src/modules/runtime-config-api/api/test/runtime-config-update.api.spec.ts)

Verifies:
- authentication and permission behavior
- successful list/update responses
- persisted updates visible via list endpoint
- sanitization during update
- update logging

---

## 12. Known Behaviors and Gotchas (Current Implementation)

| Topic | Current Behavior |
|------|-------------------|
| Defaults are authoritative | Keys not in defaults are rejected, even if present in DB. |
| DB `value` type | Persisted as string for all runtime-config types. |
| GET ordering | `findAll()` result follows defaults array order. |
| Missing DB row | Returns in-memory DO from default; value becomes persisted only after `save`. |
| Boolean parse from API input | Only `'true'` and `'false'` are accepted in `setValueFromString`; other values fail with BadRequest. |
| Boolean parse from DB entity | Mapper returns `true` only for exact `'true'`; any other persisted string becomes `false`. |
| String values | Sanitized via CK5 rich text sanitization before persisting. |
| Typed getters | `getString/getNumber/getBoolean` throw when actual type differs from expected type. |
| API update permissions | Update requires `INSTANCE_EDIT`; listing currently requires only JWT auth. |
| Logging on update | Successful updates emit structured info log via `UpdateRuntimeConfigLoggable`. |

---

## 13. Directory Structure (Relevant for Workshop)

```text
infra/runtime-config/
├── index.ts
├── injection-keys.ts
├── runtime-config.module.ts
├── domain/
│   ├── runtime-config-value.do.ts
│   ├── runtime-config.repo.interface.ts
│   ├── runtime-config.service.ts
│   └── loggable/
│       ├── runtime-config-invalid-data.loggable.ts
│       ├── runtime-config-not-expected-type.loggable.ts
│       └── runtime-config-value-invalid-type.loggable.ts
├── repo/
│   ├── runtime-config.repo.ts
│   ├── runtime-config.entity-mapper.ts
│   ├── runtime-config-value.factory.ts
│   └── entity/
│       └── runtime-config.entity.ts
└── testing/
    └── runtime-config-value.testing.factory.ts

modules/runtime-config-api/
├── runtime-config-api.module.ts
├── runtime-config-defaults.ts
├── server-runtime-config.module.ts
└── api/
    ├── runtime-config.controller.ts
    ├── runtime-config.uc.ts
    ├── mapper/runtime-config.mapper.ts
    ├── dto/request/
    │   ├── update-runtime-config-value.body.params.ts
    │   └── update-runtime-config-value.url.params.ts
    ├── dto/response/
    │   ├── runtime-config-list-item.response.ts
    │   └── runtime-config-list.response.ts
    ├── loggable/update-runtime-config.loggable.ts
    └── test/
        ├── runtime-config-list.api.spec.ts
        └── runtime-config-update.api.spec.ts
```

---

## 14. Suggested Exploration Order

1. **Start with defaults:** read [runtime-config-defaults.ts](../apps/server/src/modules/runtime-config-api/runtime-config-defaults.ts) to understand available keys and intended meaning.
2. **Understand module wiring:** read [server-runtime-config.module.ts](../apps/server/src/modules/runtime-config-api/server-runtime-config.module.ts), [runtime-config.module.ts](../apps/server/src/infra/runtime-config/runtime-config.module.ts), and [injection-keys.ts](../apps/server/src/infra/runtime-config/injection-keys.ts).
3. **Read domain object rules:** read [runtime-config-value.do.ts](../apps/server/src/infra/runtime-config/domain/runtime-config-value.do.ts) and focus on `setValue`/`setValueFromString`.
4. **Trace persistence mapping:** follow [runtime-config.repo.ts](../apps/server/src/infra/runtime-config/repo/runtime-config.repo.ts) and [runtime-config.entity-mapper.ts](../apps/server/src/infra/runtime-config/repo/runtime-config.entity-mapper.ts).
5. **Review service contract:** read [runtime-config.service.ts](../apps/server/src/infra/runtime-config/domain/runtime-config.service.ts) for consumer-facing API.
6. **Trace HTTP update path:** read [runtime-config.controller.ts](../apps/server/src/modules/runtime-config-api/api/runtime-config.controller.ts) -> [runtime-config.uc.ts](../apps/server/src/modules/runtime-config-api/api/runtime-config.uc.ts) -> [update-runtime-config.loggable.ts](../apps/server/src/modules/runtime-config-api/api/loggable/update-runtime-config.loggable.ts).
7. **See a production consumer:** open [tsp-sync.strategy.ts](../apps/server/src/infra/sync/strategy/tsp/tsp-sync.strategy.ts) and inspect `IS_SCHOOL_YEAR_CHANGE_ACTIVE` usage.
8. **Confirm behavior via tests:** inspect the four test files listed in section 11.

---

## 15. Key Files Quick Reference

| Purpose | File |
|---------|------|
| Runtime config module wiring | [runtime-config.module.ts](../apps/server/src/infra/runtime-config/runtime-config.module.ts) |
| DI tokens | [injection-keys.ts](../apps/server/src/infra/runtime-config/injection-keys.ts) |
| Domain object + typing/parsing | [runtime-config-value.do.ts](../apps/server/src/infra/runtime-config/domain/runtime-config-value.do.ts) |
| Runtime config service API | [runtime-config.service.ts](../apps/server/src/infra/runtime-config/domain/runtime-config.service.ts) |
| Repository implementation | [runtime-config.repo.ts](../apps/server/src/infra/runtime-config/repo/runtime-config.repo.ts) |
| Entity mapping | [runtime-config.entity-mapper.ts](../apps/server/src/infra/runtime-config/repo/runtime-config.entity-mapper.ts) |
| Persistence entity | [runtime-config.entity.ts](../apps/server/src/infra/runtime-config/repo/entity/runtime-config.entity.ts) |
| API module | [runtime-config-api.module.ts](../apps/server/src/modules/runtime-config-api/runtime-config-api.module.ts) |
| Runtime defaults | [runtime-config-defaults.ts](../apps/server/src/modules/runtime-config-api/runtime-config-defaults.ts) |
| Runtime config controller | [runtime-config.controller.ts](../apps/server/src/modules/runtime-config-api/api/runtime-config.controller.ts) |
| Runtime config use case | [runtime-config.uc.ts](../apps/server/src/modules/runtime-config-api/api/runtime-config.uc.ts) |
| Update loggable | [update-runtime-config.loggable.ts](../apps/server/src/modules/runtime-config-api/api/loggable/update-runtime-config.loggable.ts) |
| Consumer example (TSP sync switch) | [tsp-sync.strategy.ts](../apps/server/src/infra/sync/strategy/tsp/tsp-sync.strategy.ts) |

---

*Document prepared for technical handover, July 2026.*
