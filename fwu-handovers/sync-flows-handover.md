# Technical Handover: Synchronization Flows (TSP, Moin.Schule / Schulconnex, LDAP)

## Document Purpose & Structure

This document guides new developers through the synchronization-related code in the SVS (Schulcloud-Verbund-Software). It is designed to be presented by someone familiar with the code, not read in isolation. The structure follows a logical learning path: concepts → shared infrastructure → per-system deep dives → practical guidance.

**Prerequisites:** Familiarity with the [general architecture patterns](https://documentation.dbildungscloud.dev/docs/backend-design-patterns/architecture), especially the three-layer model (API → Domain → Repository) and NestJS module conventions. The [authentication handover](./authentication-handover.md) is a companion document — authentication and synchronization are closely related but deliberately separated. Where they intersect, cross-references are provided.

**Out of scope:** Authentication flows (login, JWT lifecycle, session management) are covered in the [authentication handover](./authentication-handover.md). This document only covers *data synchronization* — importing and keeping schools, users, and classes/groups in sync with external Identity Management (IDM) systems.

---

## 1. Overview & Conceptual Foundation

### 1.1 What Does "Synchronization" Mean Here?

Synchronization in the SVS answers: **"How do we keep our user, school, and class data consistent with external IDM systems?"** It covers:

1. **User provisioning** – Creating and updating User + Account entities based on external data
2. **School provisioning** – Creating and updating School entities from external sources
3. **Class/Group provisioning** – Managing class and group memberships based on external data
4. **Scheduled batch sync** – Periodically fetching all data from external systems (TSP, LDAP)
5. **Login-triggered provisioning** – Updating data on-the-fly when a user logs in via OAuth2 (Schulconnex, TSP)

### 1.2 The Three IDM Systems

Each of the SVS's major customer states uses a different external Identity Management system:

| IDM System | State | Protocol | Sync Trigger | Codebase |
|------------|-------|----------|--------------|----------|
| **TSP** (Thüringer Schulportal) | Thuringia | REST API (OAuth2 client credentials) | Scheduled cron + login-time | NestJS (`@infra/sync`, `@modules/provisioning`) |
| **Moin.Schule** (via Schulconnex) | Lower Saxony | Schulconnex API (OAuth2 access token) | Login-time only (no batch sync) | NestJS (`@modules/provisioning`) |
| **LDAP** (generic + Univention variant) | Brandenburg + others | LDAP protocol | Scheduled cron only | Feathers legacy (`src/services/sync`, `src/services/ldap`) |

### 1.3 Two Synchronization Modes

The SVS has two fundamentally different ways data arrives from external systems:

```
┌─────────────────────────────────────────────────────────────────┐
│                   LOGIN-TRIGGERED PROVISIONING                  │
│  User logs in via OAuth2 → access token used to fetch          │
│  external data → user/school/classes created or updated        │
│  Used by: TSP, Moin.Schule / Schulconnex                       │
│  Code: ProvisioningService → Strategy.getData() + apply()      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     SCHEDULED BATCH SYNC                        │
│  Cron job triggers bulk fetch → all schools/users/classes      │
│  created or updated in batches                                  │
│  Used by: TSP (NestJS), LDAP (Feathers legacy)                 │
│  Code: SyncConsole → SyncService → SyncStrategy.sync()         │
│         or Feathers /sync endpoint → LDAPSystemSyncer          │
└─────────────────────────────────────────────────────────────────┘
```

> **Important:** Moin.Schule / Schulconnex has **no scheduled batch sync**. Data is only provisioned at login time. This means there is no mechanism to bulk-delete or bulk-update users who haven't logged in recently — a known limitation that makes data cleanup for this system particularly difficult and dangerous.

### 1.4 What Gets Synced

All three systems sync the same core entities, but use different internal representations:

| External Concept | SVS Entity | TSP | Schulconnex | LDAP |
|-----------------|------------|-----|-------------|------|
| School | `School` / `LegacySchoolDo` | `RobjExportSchule` | Schulconnex `organisation` | LDAP OU entry |
| User | `UserDo` + `Account` | `RobjExportLehrer` / `RobjExportSchueler` | Schulconnex `person` | LDAP person entry |
| Class/Group | `Class` / `Group` | `RobjExportKlasse` | Schulconnex `gruppe` | LDAP group entry |
| Role | `RoleReference` | `ptscListRolle` JWT claim | Schulconnex `rolle` | LDAP `objectClass` / attribute |

### 1.5 Connection to Authentication

Synchronization connects to authentication at specific handoff points (see [authentication handover](./authentication-handover.md)):

- **OAuth2 login triggers provisioning:** `OAuthService.authenticateUser()` → calls `ProvisioningService.getData()` + `ProvisioningService.provisionData()`. This is the entry point for Schulconnex and TSP login-time provisioning.
- **LDAP login does NOT trigger sync:** `LdapStrategy` only performs an LDAP bind for credential verification. LDAP sync is a completely separate scheduled process.
- **The `System` entity is the bridge:** `System.provisioningStrategy` determines which provisioning strategy handles a given external system. `System.oauthConfig` and `System.ldapConfig` hold the connection details.

---

## 2. The System Entity — Central Configuration Hub

### 2.1 Why It Matters

Every sync flow starts by looking up a `System` entity. The System holds all configuration for connecting to an external IDM.

📁 [system.do.ts](../apps/server/src/modules/system/domain/do/system.do.ts)

```typescript
class System extends DomainObject<SystemProps> {
    type: SystemType | string       // 'oauth', 'ldap', 'oidc', etc.
    alias?: string                   // Human-readable name
    displayName?: string
    provisioningStrategy?: SystemProvisioningStrategy  // Which strategy handles this system
    provisioningUrl?: string         // URL for fetching provisioning data
    oauthConfig?: OauthConfig        // OAuth2 connection details
    ldapConfig?: LdapConfig          // LDAP connection details
    oidcConfig?: OidcConfig          // OIDC-specific config
}
```

### 2.2 System Types

📁 [system-type.enum.ts](../apps/server/src/modules/system/domain/type/system-type.enum.ts)

| SystemType | Used By |
|-----------|---------|
| `OAUTH` | TSP, Moin.Schule (Schulconnex) |
| `LDAP` | Generic LDAP, Univention |
| `OIDC` | TSP (also has OIDC aspects) |
| `TSP_BASE` / `TSP_SCHOOL` | Legacy TSP types |

### 2.3 Provisioning Strategies

📁 [system-provisioning.strategy.ts](../apps/server/src/shared/domain/interface/system-provisioning.strategy.ts)

```typescript
enum SystemProvisioningStrategy {
    SCHULCONNEX_ASYNC = 'schulconnex-async',  // Moin.Schule
    TSP = 'tsp',                              // Thüringer Schulportal
    OIDC = 'oidc',                            // Generic OIDC (minimal provisioning)
    ERWIN = 'erwin',                          // Erwin IdP (currently disabled)
    UNDEFINED = 'undefined',
}
```

### 2.4 LDAP Configuration

📁 [ldap-config.ts](../apps/server/src/modules/system/domain/ldap-config.ts)

```typescript
class LdapConfig {
    active: boolean                  // Whether sync is enabled
    url: string                      // LDAP server URL
    provider?: string                // 'general' or 'univention' (strategy selection!)
    federalState?: EntityId          // Associated federal state
    lastSyncAttempt?: Date
    lastSuccessfulFullSync?: Date
    rootPath?: string                // LDAP base DN
    searchUser?: string              // Bind DN for search operations
    searchUserPassword?: string      // Bind password
}
```

**Key insight:** `ldapConfig.provider` determines which LDAP strategy is used (`'general'` or `'univention'`). This is the LDAP equivalent of `provisioningStrategy` for OAuth systems.

---

## 3. Provisioning Module — Shared Infrastructure for OAuth-Based Sync

### 3.1 Module Overview

The `ProvisioningModule` is the shared core for all OAuth-based provisioning (TSP and Schulconnex). It provides a strategy pattern that delegates system-specific logic to dedicated strategy classes.

📁 [provisioning.module.ts](../apps/server/src/modules/provisioning/provisioning.module.ts)

```
┌─────────────────────────────────────────────────────────────────┐
│                      ProvisioningModule                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               ProvisioningService                        │   │
│  │  getData(systemId, idToken, accessToken) → OauthDataDto  │   │
│  │  provisionData(oauthData) → ProvisioningDto              │   │
│  │  (Dispatches to registered strategy by system type)      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────┐  ┌──────────────────────┐  ┌────────────┐  │
│  │ TspProvisioning│  │ SchulconnexAsync      │  │ Oidc       │  │
│  │ Strategy       │  │ ProvisioningStrategy  │  │ Strategy   │  │
│  │ (TSP)          │  │ (Moin.Schule)         │  │ (minimal)  │  │
│  └────────────────┘  └──────────────────────┘  └────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Shared Provisioning Services                │   │
│  │  TspProvisioningService, SchulconnexSchoolProvisioning,  │   │
│  │  SchulconnexUserProvisioning, SchulconnexGroupProv, etc. │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 The Strategy Pattern

📁 [base.strategy.ts](../apps/server/src/modules/provisioning/strategy/base.strategy.ts)

```typescript
abstract class ProvisioningStrategy {
    abstract getType(): SystemProvisioningStrategy;
    abstract getData(input: OauthDataStrategyInputDto): Promise<OauthDataDto>;
    abstract apply(data: OauthDataDto): Promise<ProvisioningDto>;
}
```

Every strategy implements two phases:
1. **`getData()`** — Extract external user/school/class data from tokens or APIs
2. **`apply()`** — Create or update SVS entities based on that data

### 3.3 ProvisioningService — The Dispatcher

📁 [provisioning.service.ts](../apps/server/src/modules/provisioning/service/provisioning.service.ts)

```typescript
class ProvisioningService {
    // Registers all strategies in constructor
    constructor(schulconnexAsyncStrategy, oidcStrategy, tspStrategy, erwinStrategy) {
        this.registerStrategy(schulconnexAsyncStrategy);
        this.registerStrategy(oidcStrategy);
        this.registerStrategy(tspStrategy);
        this.registerStrategy(erwinStrategy);
    }

    async getData(systemId, idToken, accessToken): Promise<OauthDataDto> {
        const system = await this.determineInput(systemId);       // Load System
        const strategy = this.getProvisioningStrategy(system.provisioningStrategy);
        return strategy.getData({ accessToken, idToken, system }); // Delegate
    }

    async provisionData(oauthData): Promise<ProvisioningDto> {
        const strategy = this.getProvisioningStrategy(oauthData.system.provisioningStrategy);
        return strategy.apply(oauthData);                          // Delegate
    }
}
```

### 3.4 Shared DTOs — The Common Data Language

📁 [dto/](../apps/server/src/modules/provisioning/dto/)

All strategies communicate through the same DTOs, regardless of external format:

| DTO | Purpose |
|-----|---------|
| `OauthDataStrategyInputDto` | Input: access token + id token + system info |
| `OauthDataDto` | Normalized external data: user, school, classes/groups, licenses |
| `ExternalUserDto` | External user: externalId, name, roles, email, birthday |
| `ExternalSchoolDto` | External school: externalId, name, officialSchoolNumber |
| `ExternalClassDto` | External class: externalId, name, gradeLevel |
| `ExternalGroupDto` | External group: externalId, name, type, users, period |
| `ProvisioningDto` | Output: externalUserId (confirms successful provisioning) |

### 3.5 Directory Structure

```
provisioning/
├── amqp/                                    # RabbitMQ producers/consumers (Schulconnex async)
│   ├── schulconnex-group-provisioning.producer.ts
│   ├── schulconnex-group-provisioning.consumer.ts
│   ├── schulconnex-group-removal.consumer.ts
│   ├── schulconnex-license-provisioning.consumer.ts
│   └── schulconnex.exchange.ts              # Event names enum
├── domain/
│   ├── interface/                           # AMQP message types
│   └── error/
├── dto/                                     # Shared DTOs (External*Dto, OauthDataDto, etc.)
├── mapper/
├── service/
│   ├── provisioning.service.ts              # Central dispatcher
│   ├── tsp-provisioning.service.ts          # TSP-specific provisioning logic
│   ├── school-provisioning.handler.ts       # Generic school handler
│   ├── user-provisioning.handler.ts         # Generic user handler
│   └── class-provisioning-handler.ts        # Generic class handler
├── strategy/
│   ├── base.strategy.ts                     # Abstract strategy interface
│   ├── oidc/
│   │   └── oidc.strategy.ts                 # Minimal OIDC (just extracts externalId)
│   ├── schulconnex/
│   │   ├── schulconnex-async-provisioning.strategy.ts  # Moin.Schule strategy
│   │   ├── schulconnex-response-mapper.ts              # Maps Schulconnex API → DTOs
│   │   └── service/
│   │       ├── schulconnex-school-provisioning.service.ts
│   │       ├── schulconnex-user-provisioning.service.ts
│   │       ├── schulconnex-group-provisioning.service.ts
│   │       ├── schulconnex-license-provisioning.service.ts
│   │       ├── schulconnex-course-sync.service.ts
│   │       └── schulconnex-tool-provisioning.service.ts
│   ├── tsp/
│   │   ├── tsp.strategy.ts                  # TSP login-time strategy
│   │   └── tsp.jwt.payload.ts               # TSP JWT claim structure
│   └── erwin/                               # Erwin strategy (currently disabled)
├── provisioning.module.ts
├── provisioning.config.ts
└── provisioning-exchange.config.ts          # RabbitMQ exchange config
```

---

## 4. TSP Synchronization (Thüringer Schulportal)

### 4.1 Concept

TSP provides a REST API that exports schools, teachers, students, and classes. The SVS has **two paths** for TSP data, both ultimately using the same `TspProvisioningService`:

| Path | Trigger | Scope | Code Location |
|------|---------|-------|---------------|
| **Batch sync** (primary) | Kubernetes cron job | All schools/users/classes for the system | `@infra/sync/strategy/tsp/` |
| **Login-time provisioning** | User logs in via OAuth2 | Single user + their school + classes | `@modules/provisioning/strategy/tsp/` |

### 4.2 Batch Sync — High-Level Flow

```
Kubernetes CronJob
    │
    ▼
npm run nest:start:console sync run tsp
    │
    ▼
SyncConsole.startSync('tsp')
    └─► SyncUc.startSync('tsp')
        └─► SyncService.startSync('tsp')
            └─► TspSyncStrategy.sync()
                │
                ├─► 1. Check runtime config (skip if school year change active)
                ├─► 2. Find TSP System entity (type=OAuth, strategy=TSP)
                │
                ├─► 3. syncTspSchools(system)
                │   ├─► TspFetchService.fetchTspSchools(system, daysToFetch)
                │   │   └─► TSP API: GET /exportSchuleList (client credentials)
                │   └─► For each school: TspSchoolService.updateOrCreate()
                │       └─► SchoolService.save()
                │
                └─► 4. syncUsersAndClasses(system)
                    ├─► TspFetchService.fetchTspTeachers/Students/Classes()
                    │   └─► TSP API: GET /exportLehrerList, /exportSchuelerList, /exportKlasseList
                    ├─► TspOauthDataMapper.mapTspDataToOauthData()
                    │   └─► Transforms raw API data → OauthDataDto[]
                    ├─► TspProvisioningService.provisionUserBatch() (in batches)
                    │   └─► Create/update User + Account for each
                    └─► TspProvisioningService.provisionClassBatch() (per school)
                        └─► Create/update Class entities with teacher/student IDs
```

### 4.3 Login-Time Provisioning — Flow

```
User logs in via OAuth2 (POST /authentication/oauth2)
    │
    ▼
Oauth2Strategy.validate() → Oauth2ContextHelper
    └─► ProvisioningService.getData(systemId, idToken, accessToken)
        └─► TspProvisioningStrategy.getData(input)
            │
            ├─► Decode access token → TspJwtPayload
            │   (sub, ptscListRolle, personVorname, personNachname,
            │    ptscSchuleNummer, ptscListKlasseId)
            │
            └─► Build OauthDataDto with:
                ├─► ExternalUserDto (from JWT claims)
                ├─► ExternalSchoolDto (ptscSchuleNummer)
                └─► ExternalClassDto[] (ptscListKlasseId, comma-separated)
    │
    └─► ProvisioningService.provisionData(oauthData)
        └─► TspProvisioningStrategy.apply(data)
            ├─► TspProvisioningService.findSchoolOrFail()
            ├─► TspProvisioningService.provisionUser()
            │   └─► Find or create User + Account
            └─► TspProvisioningService.provisionClasses()
                └─► Find or create Class, add user as teacher/student
```

### 4.4 Key Differences Between the Two Paths

| Aspect | Batch Sync | Login-Time |
|--------|-----------|------------|
| Data source | TSP REST API (client credentials grant) | JWT claims in access token |
| Scope | All users across all schools | Single user |
| School creation | Yes — creates new schools | No — school must already exist |
| Class handling | Full batch with `provisionClassBatch()` (can clear participants) | Per-user with `provisionClasses()` (additive only) |
| Batching | Configurable batch size (`TSP_SYNC_DATA_LIMIT`) | N/A |
| Delta support | `daysToFetch` parameter filters by change date | Always full for that user |

### 4.5 TSP JWT Payload

📁 [tsp.jwt.payload.ts](../apps/server/src/modules/provisioning/strategy/tsp/tsp.jwt.payload.ts)

```typescript
class TspJwtPayload {
    sub: string              // External user ID
    sid?: string             // Session ID
    ptscListRolle: string    // Comma-separated roles ("Lehrer", "Schueler", "Admin")
    personVorname: string    // First name
    personNachname: string   // Last name
    ptscSchuleNummer: string // School number
    ptscListKlasseId?: string // Comma-separated class IDs
}
```

**Role mapping:**

| TSP Role | SVS RoleName |
|----------|-------------|
| `Lehrer` | `TEACHER` |
| `Schueler` | `STUDENT` |
| `Admin` | `ADMINISTRATOR` |

### 4.6 TSP Batch Sync — Key Services

#### TspFetchService

📁 [tsp-fetch.service.ts](../apps/server/src/infra/sync/strategy/tsp/tsp-fetch.service.ts)

Handles HTTP communication with the TSP API using a generated client (`TspClientFactory`):

| Method | TSP API Endpoint | Returns |
|--------|-----------------|---------|
| `fetchTspSchools()` | `exportSchuleList` | `RobjExportSchule[]` |
| `fetchTspTeachers()` | `exportLehrerList` | `RobjExportLehrer[]` |
| `fetchTspStudents()` | `exportSchuelerList` | `RobjExportSchueler[]` |
| `fetchTspClasses()` | `exportKlasseList` | `RobjExportKlasse[]` |

All methods accept a `daysToFetch` parameter: `-1` means full sync (since epoch), otherwise fetches changes from `now - daysToFetch`.

📁 [tsp-client.module.ts](../apps/server/src/infra/tsp-client/tsp-client.module.ts) — Generated OpenAPI client for the TSP API.

#### TspOauthDataMapper

📁 [tsp-oauth-data.mapper.ts](../apps/server/src/infra/sync/strategy/tsp/tsp-oauth-data.mapper.ts)

Transforms raw TSP API responses into `OauthDataDto[]` for batch processing:

- Maps `RobjExportLehrer` → `ExternalUserDto` (with `TEACHER` / `ADMINISTRATOR` roles)
- Maps `RobjExportSchueler` → `ExternalUserDto` (with `STUDENT` role, deduplicates)
- Maps `RobjExportKlasse` → `ExternalClassDto` (with class name parsing and grade level extraction)
- Builds a `usersOfClasses` map linking class IDs to their teacher/student members

#### TspSchoolService

📁 [tsp-school.service.ts](../apps/server/src/infra/sync/strategy/tsp/tsp-school.service.ts)

Handles school CRUD for TSP. New schools are created with:
- Federal state: Thüringen
- Feature: `OAUTH_PROVISIONING_ENABLED`
- File storage: AWS S3

#### TspProvisioningService

📁 [tsp-provisioning.service.ts](../apps/server/src/modules/provisioning/service/tsp-provisioning.service.ts)

Shared by both batch sync and login-time provisioning. Key methods:

| Method | Used By | Purpose |
|--------|---------|---------|
| `provisionUserBatch()` | Batch sync | Create/update users and accounts in bulk |
| `provisionClassBatch()` | Batch sync | Create/update classes with full member lists |
| `provisionUser()` | Login-time | Create/update single user + account |
| `provisionClasses()` | Login-time | Create/update classes for a single user |
| `findSchoolOrFail()` | Login-time | Find school by system + external ID |

**TSP-specific behaviors:**
- Email addresses are generated as `{externalId}@schul-cloud.org`
- Consent objects are auto-created (both user and parent consent)
- Entity `source` field is set to `'tsp'`
- Classes use `ClassSourceOptions.tspUid` for external ID tracking

### 4.7 TSP Configuration

📁 [sync.config.ts](../apps/server/src/infra/sync/sync.config.ts)

| Config Key | Default | Purpose |
|-----------|---------|---------|
| `FEATURE_TSP_SYNC_ENABLED` | `false` | Activates TSP strategy in sync console |
| `WITH_TSP_SYNC` | – | Activates the cron job in Kubernetes |
| `TSP_SYNC_SCHOOL_LIMIT` | `10` | Concurrent school processing limit |
| `TSP_SYNC_SCHOOL_DAYS_TO_FETCH` | `1` | Days of school changes to fetch |
| `TSP_SYNC_DATA_LIMIT` | `150` | Batch size for user provisioning |
| `TSP_SYNC_DATA_DAYS_TO_FETCH` | `1` | Days of user/class changes to fetch |
| `TSP_API_CLIENT_BASE_URL` | – | TSP API base URL |
| `TSP_API_TOKEN_LIFETIME_MS` | – | TSP access token lifetime |

### 4.8 Key Files Quick Reference (TSP)

| Purpose | File |
|---------|------|
| Sync strategy (batch) | [tsp-sync.strategy.ts](../apps/server/src/infra/sync/strategy/tsp/tsp-sync.strategy.ts) |
| Fetch service | [tsp-fetch.service.ts](../apps/server/src/infra/sync/strategy/tsp/tsp-fetch.service.ts) |
| Data mapper (batch) | [tsp-oauth-data.mapper.ts](../apps/server/src/infra/sync/strategy/tsp/tsp-oauth-data.mapper.ts) |
| School service | [tsp-school.service.ts](../apps/server/src/infra/sync/strategy/tsp/tsp-school.service.ts) |
| Provisioning strategy (login) | [tsp.strategy.ts](../apps/server/src/modules/provisioning/strategy/tsp/tsp.strategy.ts) |
| JWT payload | [tsp.jwt.payload.ts](../apps/server/src/modules/provisioning/strategy/tsp/tsp.jwt.payload.ts) |
| Provisioning service (shared) | [tsp-provisioning.service.ts](../apps/server/src/modules/provisioning/service/tsp-provisioning.service.ts) |
| Sync module | [sync.module.ts](../apps/server/src/infra/sync/sync.module.ts) |
| Sync config | [sync.config.ts](../apps/server/src/infra/sync/sync.config.ts) |
| Console command | [sync.console.ts](../apps/server/src/infra/sync/console/sync.console.ts) |
| TSP client infra | [tsp-client.module.ts](../apps/server/src/infra/tsp-client/tsp-client.module.ts) |

---

## 5. Moin.Schule / Schulconnex Synchronization (Lower Saxony)

### 5.1 Concept

[Schulconnex](https://schulconnex.github.io/Schulconnex/) is a standardized API for synchronizing identity and school context data. Moin.Schule is Lower Saxony's implementation of Schulconnex.

**Key characteristic:** There is **no scheduled batch sync** for Schulconnex. All provisioning happens at login time when the user authenticates via OAuth2. The SVS calls the Schulconnex `person-info` endpoint using the user's access token to fetch their data.

📁 External docs:
- [Moin.Schule concept](https://documentation.dbildungscloud.dev/docs/topics/moin-punkt-schule/concept)
- [Schulconnex specification](https://schulconnex.github.io/Schulconnex/)

### 5.2 Login-Time Provisioning Flow

```
User logs in via OAuth2 (POST /authentication/oauth2)
    │
    ▼
Oauth2Strategy.validate() → Oauth2ContextHelper
    └─► ProvisioningService.getData(systemId, idToken, accessToken)
        └─► SchulconnexAsyncProvisioningStrategy.getData(input)
            │
            ├─► SchulconnexRestClient.getPersonInfo(accessToken)
            │   └─► GET {provisioningUrl} (Schulconnex person-info endpoint)
            │
            ├─► Validate response structure
            │
            ├─► SchulconnexResponseMapper.mapToExternalUserDto()
            ├─► SchulconnexResponseMapper.mapToExternalSchoolDto()
            │
            ├─► [If group provisioning enabled]
            │   SchulconnexResponseMapper.mapToExternalGroupDtos()
            │
            └─► [If media license enabled]
                SchulconnexRestClient.getPoliciesInfo(accessToken)
                └─► Maps to ExternalLicenseDto[]
    │
    └─► ProvisioningService.provisionData(oauthData)
        └─► SchulconnexAsyncProvisioningStrategy.apply(data)
            │
            ├─► SchulconnexSchoolProvisioningService.provisionExternalSchool()
            │   └─► Find or create LegacySchoolDo
            │
            ├─► SchulconnexUserProvisioningService.provisionExternalUser()
            │   └─► Find or create UserDo + Account
            │
            ├─► [If group provisioning enabled]
            │   ├─► Filter groups by school provisioning options
            │   ├─► Find existing groups, remove user from unmentioned groups
            │   │   └─► SchulconnexGroupProvisioningProducer (→ RabbitMQ)
            │   └─► Provision each group
            │       └─► SchulconnexGroupProvisioningProducer (→ RabbitMQ)
            │
            └─► [If license provisioning enabled]
                └─► SchulconnexLicenseProvisioningProducer (→ RabbitMQ)
```

### 5.3 SchulconnexAsyncProvisioningStrategy

📁 [schulconnex-async-provisioning.strategy.ts](../apps/server/src/modules/provisioning/strategy/schulconnex/schulconnex-async-provisioning.strategy.ts)

The "Async" in the name refers to the fact that group and license provisioning are sent to RabbitMQ for asynchronous processing, rather than being done inline during login.

**getData():**
1. Calls `SchulconnexRestClient.getPersonInfo()` with the user's access token
2. Validates the response using `class-validator` with validation groups
3. Maps the response to DTOs using `SchulconnexResponseMapper`
4. If `featureSchulconnexGroupProvisioningEnabled`, also maps group data
5. If `featureSchulconnexMediaLicenseEnabled`, also fetches and maps license data from `policies-info`

**apply():**
1. Provisions the school synchronously (inline)
2. Provisions the user synchronously (inline)
3. Sends group provisioning/removal to RabbitMQ (async)
4. Sends license provisioning to RabbitMQ (async)

**Special behavior:** Administrators automatically receive the `TEACHER` role as well (`addTeacherRoleIfAdmin()`).

### 5.4 SchulconnexResponseMapper

📁 [schulconnex-response-mapper.ts](../apps/server/src/modules/provisioning/strategy/schulconnex/schulconnex-response-mapper.ts)

Maps Schulconnex API responses to SVS DTOs. Key mappings:

**Role mapping:**

| Schulconnex Role | SVS RoleName |
|-----------------|-------------|
| `Lehr` | `TEACHER` |
| `Lern` | `STUDENT` |
| `Leit` | `ADMINISTRATOR` |
| `OrgAdmin` | `ADMINISTRATOR` |
| `Extern` | `EXTERNALPERSON` |

**Group type mapping:**

| Schulconnex GroupType | SVS GroupTypes |
|----------------------|---------------|
| `CLASS` | `CLASS` |
| `COURSE` | `COURSE` |
| `OTHER` | `OTHER` |

**School number:** The prefix `NI_` is stripped from the school's `kennung` (identifier) to derive the `officialSchoolNumber`.

### 5.5 Schulconnex Provisioning Services

#### SchulconnexSchoolProvisioningService

📁 [schulconnex-school-provisioning.service.ts](../apps/server/src/modules/provisioning/strategy/schulconnex/service/schulconnex-school-provisioning.service.ts)

- Finds existing school by `externalId` + `systemId`
- Creates new schools with federal state: Niedersachsen, feature: `OAUTH_PROVISIONING_ENABLED`
- Formats school name as `"{name} ({location})"` when location is available

#### SchulconnexUserProvisioningService

📁 [schulconnex-user-provisioning.service.ts](../apps/server/src/modules/provisioning/strategy/schulconnex/service/schulconnex-user-provisioning.service.ts)

- Finds existing user by `externalId` + `systemId`
- Creates new accounts with a SHA-256 hash of the user ID as username (these accounts have no password — authentication is purely via OAuth2)
- Updates name, email, roles, school, birthday on each login

#### SchulconnexGroupProvisioningService

📁 [schulconnex-group-provisioning.service.ts](../apps/server/src/modules/provisioning/strategy/schulconnex/service/schulconnex-group-provisioning.service.ts)

- Handles group create/update based on external data
- Respects per-school provisioning options (`SchulConneXProvisioningOptions`):
  - `groupProvisioningClassesEnabled`
  - `groupProvisioningCoursesEnabled`
  - `groupProvisioningOtherEnabled`
- Can remove users from groups and delete empty groups
- Triggers course synchronization when groups change

### 5.6 Asynchronous Processing via RabbitMQ

Group and license provisioning is offloaded to RabbitMQ to avoid blocking the login response. The architecture uses a producer/consumer pattern within the same application.

📁 [schulconnex.exchange.ts](../apps/server/src/modules/provisioning/amqp/schulconnex.exchange.ts)

```typescript
enum SchulconnexProvisioningEvents {
    GROUP_PROVISIONING = 'schulconnex-group-provisioning',
    GROUP_REMOVAL = 'schulconnex-group-removal',
    LICENSE_PROVISIONING = 'schulconnex-license-provisioning',
}
```

#### Producers

| Producer | Event | Payload |
|----------|-------|---------|
| `SchulconnexGroupProvisioningProducer` | `GROUP_PROVISIONING` | `{ systemId, externalGroup, externalSchool }` |
| `SchulconnexGroupProvisioningProducer` | `GROUP_REMOVAL` | `{ userId, groupId }` |
| `SchulconnexLicenseProvisioningProducer` | `LICENSE_PROVISIONING` | `{ userId, schoolId, systemId, externalLicenses }` |

📁 [schulconnex-group-provisioning.producer.ts](../apps/server/src/modules/provisioning/amqp/schulconnex-group-provisioning.producer.ts)

#### Consumers

| Consumer | What It Does |
|----------|-------------|
| `SchulconnexGroupProvisioningConsumer` | Calls `provisionExternalGroup()`, then syncs courses if enabled |
| `SchulconnexGroupRemovalConsumer` | Calls `removeUserFromGroup()`, then syncs courses if enabled |
| `SchulconnexLicenseProvisioningConsumer` | Provisions media licenses for the user |

📁 [schulconnex-group-provisioning.consumer.ts](../apps/server/src/modules/provisioning/amqp/schulconnex-group-provisioning.consumer.ts)
📁 [schulconnex-group-removal.consumer.ts](../apps/server/src/modules/provisioning/amqp/schulconnex-group-removal.consumer.ts)

Each consumer runs in a separate app module for independent scaling:
- `SchulconnexGroupProvisioningConsumerModule` → `schulconnex-group-provisioning-amqp.app.module.ts`
- `SchulconnexGroupRemovalConsumerModule` → `schulconnex-group-removal-amqp.app.module.ts`
- `SchulconnexLicenseProvisioningConsumerModule` → `schulconnex-license-provisioning-amqp.app.module.ts`

### 5.7 Schulconnex Client Infrastructure

📁 [schulconnex-client.module.ts](../apps/server/src/infra/schulconnex-client/schulconnex-client.module.ts)

The `SchulconnexRestClient` handles HTTP calls to Schulconnex endpoints:

| Method | Schulconnex Endpoint | Purpose |
|--------|---------------------|---------|
| `getPersonInfo()` | `person-info` | Get user + school + groups data |
| `getPoliciesInfo()` | `policies-info` | Get media license data |

### 5.8 No Batch Sync — Implications

Since Schulconnex provisioning only happens at login:
- **Users who never log in** are never created in SVS
- **Users who stop logging in** are never removed — their data becomes stale
- **Bulk data operations** (cleanup, migration) require manual intervention or custom scripts
- **Deletion** of user data for users who are removed in Moin.Schule cannot be automatically detected

### 5.9 Key Files Quick Reference (Schulconnex)

| Purpose | File |
|---------|------|
| Provisioning strategy | [schulconnex-async-provisioning.strategy.ts](../apps/server/src/modules/provisioning/strategy/schulconnex/schulconnex-async-provisioning.strategy.ts) |
| Response mapper | [schulconnex-response-mapper.ts](../apps/server/src/modules/provisioning/strategy/schulconnex/schulconnex-response-mapper.ts) |
| School provisioning | [schulconnex-school-provisioning.service.ts](../apps/server/src/modules/provisioning/strategy/schulconnex/service/schulconnex-school-provisioning.service.ts) |
| User provisioning | [schulconnex-user-provisioning.service.ts](../apps/server/src/modules/provisioning/strategy/schulconnex/service/schulconnex-user-provisioning.service.ts) |
| Group provisioning | [schulconnex-group-provisioning.service.ts](../apps/server/src/modules/provisioning/strategy/schulconnex/service/schulconnex-group-provisioning.service.ts) |
| Course sync | [schulconnex-course-sync.service.ts](../apps/server/src/modules/provisioning/strategy/schulconnex/service/schulconnex-course-sync.service.ts) |
| License provisioning | [schulconnex-license-provisioning.service.ts](../apps/server/src/modules/provisioning/strategy/schulconnex/service/schulconnex-license-provisioning.service.ts) |
| AMQP exchange | [schulconnex.exchange.ts](../apps/server/src/modules/provisioning/amqp/schulconnex.exchange.ts) |
| Group producer | [schulconnex-group-provisioning.producer.ts](../apps/server/src/modules/provisioning/amqp/schulconnex-group-provisioning.producer.ts) |
| Group consumer | [schulconnex-group-provisioning.consumer.ts](../apps/server/src/modules/provisioning/amqp/schulconnex-group-provisioning.consumer.ts) |
| Removal consumer | [schulconnex-group-removal.consumer.ts](../apps/server/src/modules/provisioning/amqp/schulconnex-group-removal.consumer.ts) |
| Schulconnex REST client | [schulconnex-rest-client.ts](../apps/server/src/infra/schulconnex-client/schulconnex-rest-client.ts) |
| Client module | [schulconnex-client.module.ts](../apps/server/src/infra/schulconnex-client/schulconnex-client.module.ts) |
| Provisioning config | [provisioning.config.ts](../apps/server/src/modules/provisioning/provisioning.config.ts) |

---

## 6. LDAP Synchronization (Brandenburg + Generic)

### 6.1 Concept

LDAP sync is the oldest synchronization mechanism in the SVS. It imports users, schools, and classes from external LDAP directories into the Bildungscloud. Unlike TSP and Schulconnex, **all LDAP sync code lives in the Feathers legacy codebase** (`src/services/`).

📁 External docs: [LDAP Sync concept](https://documentation.dbildungscloud.dev/docs/topics/ldap/concept)

**Key characteristics:**
- **Scheduled batch sync only** — no login-time provisioning (LDAP login only does a bind for credential verification)
- **Producer/Consumer via RabbitMQ** — the sync uses a message queue for scalable processing
- **Two LDAP strategies:** `general` (highly configurable, any LDAP) and `univention` (UCS@school-specific, used by Brandenburg)
- **LDAP directories are external** — the SVS never writes to them, only reads

### 6.2 Architecture Overview

```
Kubernetes CronJob or API call
    │
    ▼
Feathers /sync endpoint (target=ldap)
    │
    ▼
LDAPSystemSyncer.steps()
    │
    ├─► Find all Systems with type='ldap' + ldapConfig.active=true
    │
    └─► For each System (async pool):
        │
        ▼
        LDAPSyncer.steps()
        │
        ├─► 1. Get RabbitMQ channel
        │
        ├─► 2. processLdapSchools()
        │   ├─► LdapService.getSchools(config)
        │   │   └─► LDAP strategy.getSchools() (searches LDAP directory)
        │   └─► SyncMessageBuilder.createSchoolDataMessage()
        │       └─► RabbitMQ: SEND syncSchool message
        │
        ├─► 3. processLdapUsers(school)  [for each school]
        │   ├─► LdapService.getUsers(config, school)
        │   │   └─► LDAP strategy.getUsers(school)
        │   └─► SyncMessageBuilder.createUserDataMessage()
        │       └─► RabbitMQ: SEND syncUser message
        │
        └─► 4. processLdapClasses(school)  [for each school]
            ├─► LdapService.getClasses(config, school)
            │   └─► LDAP strategy.getClasses(school)
            └─► SyncMessageBuilder.createClassDataMessage()
                └─► RabbitMQ: SEND syncClasses message

    ═══════════════════ RabbitMQ ═══════════════════

LDAPSyncerConsumer (on all server instances)
    │
    └─► For each message:
        ├─► syncSchool → SchoolAction.action()
        ├─► syncUser   → UserAction.action()
        └─► syncClasses → ClassAction.action()
```

### 6.3 The Producer Side

#### LDAPSystemSyncer — The Entry Point

📁 [LDAPSystemSyncer.js](../src/services/sync/strategies/LDAPSystemSyncer.js)

- Responds to the sync target `'ldap'`
- Finds all `System` documents with `type: 'ldap'` and `ldapConfig.active: true`
- Runs an `LDAPSyncer` for each system using an async pool (configurable size via `LDAP_SYSTEM_SYNCER_POOL_SIZE`)
- **Detects duplicate LDAP URLs** across systems and forces sequential processing (pool size 1) to avoid connection conflicts
- Handles errors per system without aborting the entire sync
- Disconnects from each LDAP server after sync completes

#### LDAPSyncer — Per-System Sync

📁 [LDAPSyncer.js](../src/services/sync/strategies/LDAPSyncer.js)

Processes a single LDAP system:

1. **Schools:** Queries the LDAP directory for schools (OUs), sends a `syncSchool` message per school
2. **Users:** For each school, queries for users, sends a `syncUser` message per user
3. **Classes:** For each school, queries for classes, sends a `syncClasses` message per class

All data is sent via the `SyncMessageBuilder` to a RabbitMQ queue (`SYNC_QUEUE_NAME`).

#### SyncMessageBuilder

📁 [SyncMessageBuilder.js](../src/services/sync/strategies/SyncMessageBuilder.js)

Constructs structured messages for the consumer:

| Action | Message Data |
|--------|-------------|
| `syncSchool` | `{ school: { name, systems, ldapSchoolIdentifier, officialSchoolNumber, currentYear, federalState } }` |
| `syncUser` | `{ user: { firstName, lastName, systemId, schoolDn, email, ldapDn, ldapId, roles }, account: { ldapDn, ldapId, username, systemId, schoolDn, activated } }` |
| `syncClasses` | `{ class: { name, systemId, schoolDn, nameFormat, ldapDN, year, uniqueMembers } }` |

**Username format:** `{schoolDn}/{ldapUID}` (lowercased). This is important for LDAP login — the `LdapStrategy` looks up accounts using this format.

#### Syncer Base Class

📁 [Syncer.js](../src/services/sync/strategies/Syncer.js)

All syncers extend `Syncer`, which provides:
- Step-by-step execution (`steps()` method)
- Statistics tracking (success/failure counts)
- Logging
- A unique `syncId` per run for log correlation

### 6.4 The Consumer Side

#### LDAPSyncerConsumer

📁 [LDAPSyncerConsumer.js](../src/services/sync/strategies/LDAPSyncerConsumer.js)

Listens on the RabbitMQ queue and dispatches messages to action handlers:

```javascript
const consumer = new LDAPSyncerConsumer(
    new SchoolAction(shouldUseFilter),
    new UserAction(app, shouldUseFilter),
    new ClassAction(shouldUseFilter)
);
```

Enabled by `FEATURE_SYNCER_CONSUMER_ENABLE=true`. Each server instance that has this flag runs a consumer, sharing the workload via RabbitMQ.

#### BaseConsumerAction

📁 [BaseConsumerAction.js](../src/services/sync/strategies/consumerActions/BaseConsumerAction.js)

Abstract base for consumer actions. Provides:
- Type matching (which action handles which message)
- Data filtering (removes sensitive keys from log output in production)
- Error wrapping in `SyncError`

#### SchoolAction

📁 [SchoolAction.js](../src/services/sync/strategies/consumerActions/SchoolAction.js)

Handles `syncSchool` messages:

```
SchoolAction.action(data)
    │
    ├─► Find school by ldapSchoolIdentifier + systemId
    │
    ├─► If found: update name if changed → done
    │
    ├─► If not found: check for migrated school (previousExternalId)
    │   └─► If migrated: skip (school has been moved to Schulconnex)
    │
    ├─► If officialSchoolNumber exists: check for existing school
    │   └─► If found: skip (avoid duplicates)
    │
    └─► Default: create new school with default file storage
        └─► Create AWS S3 bucket in production
```

#### UserAction

📁 [UserAction.js](../src/services/sync/strategies/consumerActions/UserAction.js)

Handles `syncUser` messages. This is the most complex consumer action:

```
UserAction.action(data)
    │
    ├─► Find school by ldapSchoolIdentifier + systemId
    │   └─► Falls back to previousExternalId (migration support)
    │
    ├─► Find user by ldapId + school
    │   └─► Check for OAuth-migrated user → skip if migrated
    │
    ├─► If school.inUserMigration && no existing user:
    │   └─► Create ImportUser (for migration workflow)
    │       └─► Auto-match by firstName + lastName
    │
    ├─► If school.inMaintenance: skip (summer holidays)
    │
    ├─► If user exists: updateUserAndAccount()
    │   └─► Update name, email, roles, ldapDn
    │   └─► Optionally set lastSyncedAt (FEATURE_SYNC_LAST_SYNCED_AT_ENABLED)
    │
    └─► If new user: createUserAndAccount()
        └─► Create User entity + Account entity
```

**Key details:**
- `FEATURE_SYNC_LAST_SYNCED_AT_ENABLED` — when enabled, stamps `lastSyncedAt` on each synced user
- Migration awareness — understands `inUserMigration`, `inMaintenance`, and `previousExternalId` states

#### ClassAction

📁 [ClassAction.js](../src/services/sync/strategies/consumerActions/ClassAction.js)

Handles `syncClasses` messages:

```
ClassAction.action(data)
    │
    ├─► Find school by ldapSchoolIdentifier + systemId
    │   └─► Migration-aware (same as UserAction)
    │
    ├─► If school.inUserMigration:
    │   └─► Add class info to ImportUsers (for migration workflow)
    │
    ├─► If school.inMaintenance: skip
    │
    ├─► Find existing class by year + ldapDN
    │   ├─► If found: update name if changed
    │   └─► If not found: create new class
    │
    └─► addUsersToClass()
        ├─► Find users by ldapDn in school
        ├─► Sort into students/teachers by role
        └─► Update class members
```

### 6.5 LDAP Strategy Layer — Reading from the Directory

#### AbstractLDAPStrategy (Interface)

📁 [interface.js](../src/services/ldap/strategies/interface.js)

Defines the contract for LDAP provider strategies:

```javascript
class AbstractLDAPStrategy {
    constructor(app, config) { ... }
    getSchools() { ... }    // Find all schools in directory
    getUsers(school) { ... } // Find all users in a school
    getClasses(school) { ... } // Find all classes in a school
}
```

#### Strategy Selection

📁 [strategies/index.js](../src/services/ldap/strategies/index.js)

```javascript
const strategies = {
    univention: UniventionLDAPStrategy,
    general: GeneralLDAPStrategy,
};

module.exports = function determineStrategy(app, config) {
    // Uses config.provider to select strategy
    const LDAPStrategy = strategies[config.provider];
    return new LDAPStrategy(app, config);
};
```

The `System.ldapConfig.provider` field determines which strategy is used.

#### GeneralLDAPStrategy — Configurable LDAP

📁 [general.js](../src/services/ldap/strategies/general.js)

The general strategy is **highly configurable** through `ldapConfig.providerOptions`. It supports arbitrary LDAP schemas by mapping attribute names:

**User attribute mapping (`userAttributeNameMapping`):**

| SVS Field | Example LDAP Attribute |
|-----------|----------------------|
| `givenName` | First name attribute |
| `sn` | Surname attribute |
| `dn` | Distinguished name attribute |
| `uuid` | Immutable unique ID attribute |
| `uid` | Login identifier attribute |
| `mail` | Email attribute |
| `role` | Role attribute (if role type is `attribute`) |

**Role resolution (two modes via `roleType`):**
- `'group'` — Roles determined by `memberOf` LDAP groups, configured in `roleAttributeNameMapping`:
  - `roleStudent`, `roleTeacher`, `roleAdmin`, `roleNoSc` (excluded users)
  - Teacher role supports multiple values (`;;`-separated)
- `'attribute'` — Roles determined by a user attribute value

**Class attribute mapping (`classAttributeNameMapping`):**
- `dn`, `description` (class name), `uniqueMember`
- Optional: if `classPathAdditions` is empty, class sync is skipped

**School handling:**
- The general strategy always returns exactly **one school** (the entire LDAP tree is one school)
- School name from `providerOptions.schoolName`

**User search paths:**
- `userPathAdditions` supports multiple search paths (`;;`-separated), all relative to `rootPath`

**Key requirement for LDAP users:**

| Attribute | Requirement |
|-----------|-------------|
| uid | Unique login name |
| uuid | Immutable, unique identifier |
| mail | Unique email |
| givenName | First name |
| sn | Surname |
| objectClass | Must include `person` |

#### UniventionLDAPStrategy — UCS@school (Brandenburg)

📁 [univention.js](../src/services/ldap/strategies/univention.js)

A hardcoded strategy for [Univention Corporate Server (UCS)](https://www.univention.de/) with the UCS@school extension. This is the LDAP implementation used by Brandenburg.

**Key differences from GeneralLDAPStrategy:**

| Aspect | General | Univention |
|--------|---------|-----------|
| Schools | Single school per system | Multi-school (discovers OUs dynamically) |
| School filter | None (hardcoded single school) | `univentionObjectType=container/ou` + `ucsschoolOrganizationalUnit` |
| User filter | `objectClass=person` | `univentionObjectType=users/user` |
| Role detection | Configurable (group or attribute) | Hardcoded: `ucsschoolTeacher`, `ucsschoolStudent` objectClasses + `SchulCloudAdmin` |
| Class filter | Configurable DN path | `ucsschoolRole=school_class:school:{schoolId}` |
| User search path | Configurable | `cn=users,ou={school},{rootPath}` |
| Class search path | Configurable | `cn=klassen,cn=schueler,cn=groups,ou={school},{rootPath}` |
| Ignored schools | Not supported | `providerOptions.ignoreSchools` array |

**Univention-specific patterns:**
- Schools are LDAP OUs with `ucsschoolOrganizationalUnit` objectClass
- `officialSchoolNumber` equals the OU name (`ldapOu`)
- Users have `entryUUID` as immutable identifier, `uid` as login name
- Classes use `description` for class name, `uniqueMember` for memberships
- Experts are located in `cn=mitarbeiter,cn=users,ou=Experte`

### 6.6 LdapService — The LDAP Communication Layer

📁 [src/services/ldap/index.js](../src/services/ldap/index.js)

The `LdapService` is a Feathers service that wraps `ldapjs` for all LDAP communication:

| Method | Purpose |
|--------|---------|
| `_connect(config)` | Create LDAP client, bind with search user credentials |
| `_getClient(config)` | Get or create client (connection pooling per URL) |
| `disconnect(config)` | Unbind and destroy client |
| `searchCollection(config, searchString, options)` | Execute LDAP search with paging |
| `getSchools(config)` | Delegate to strategy `getSchools()` |
| `getUsers(config, school)` | Delegate to strategy `getUsers()` |
| `getClasses(config, school)` | Delegate to strategy `getClasses()` |

**Connection management:**
- Uses `ldapjs.createClient()` with reconnect settings (initial delay 100ms, max 300ms, fail after 3 attempts)
- Client instances are reused per URL
- A `LockingQueue` ensures search operations on the same connection are serialized

**Search behavior:**
- Paging enabled (page size 100) to avoid `max size limit exceeded` errors
- Supports `rawAttributes` for binary data (e.g., UUID as base64)

### 6.7 Sync Entry Point (Feathers)

📁 [src/services/sync/index.js](../src/services/sync/index.js)

The sync service is registered at `/sync` and supports both `find` (GET) and `create` (POST) to trigger a sync:

```javascript
app.use('/sync', new SyncService());

// Consumer setup (on each server instance):
if (Configuration.get('FEATURE_SYNCER_CONSUMER_ENABLE') === true) {
    app.configure(consumer);  // Starts consuming from RabbitMQ
}
```

**Security:** External requests require JWT authentication + `SYNC_START` permission.

### 6.8 LDAP Configuration Reference

| Config Key | Default | Purpose |
|-----------|---------|---------|
| `FEATURE_SYNCER_CONSUMER_ENABLE` | `false` | Enable RabbitMQ consumer for LDAP sync messages |
| `SYNC_QUEUE_NAME` | – | RabbitMQ queue name for sync messages |
| `LDAP_SYSTEM_SYNCER_POOL_SIZE` | – | Max concurrent LDAP system syncs |
| `FEATURE_SYNC_LAST_SYNCED_AT_ENABLED` | `false` | Stamp `lastSyncedAt` on synced users |

### 6.9 Key Files Quick Reference (LDAP)

| Purpose | File |
|---------|------|
| Sync entry point | [src/services/sync/index.js](../src/services/sync/index.js) |
| System syncer (all LDAP systems) | [LDAPSystemSyncer.js](../src/services/sync/strategies/LDAPSystemSyncer.js) |
| Per-system syncer (producer) | [LDAPSyncer.js](../src/services/sync/strategies/LDAPSyncer.js) |
| Message builder | [SyncMessageBuilder.js](../src/services/sync/strategies/SyncMessageBuilder.js) |
| Consumer dispatcher | [LDAPSyncerConsumer.js](../src/services/sync/strategies/LDAPSyncerConsumer.js) |
| Base consumer action | [BaseConsumerAction.js](../src/services/sync/strategies/consumerActions/BaseConsumerAction.js) |
| School action | [SchoolAction.js](../src/services/sync/strategies/consumerActions/SchoolAction.js) |
| User action | [UserAction.js](../src/services/sync/strategies/consumerActions/UserAction.js) |
| Class action | [ClassAction.js](../src/services/sync/strategies/consumerActions/ClassAction.js) |
| Base syncer | [Syncer.js](../src/services/sync/strategies/Syncer.js) |
| LDAP service (communication) | [src/services/ldap/index.js](../src/services/ldap/index.js) |
| Strategy interface | [src/services/ldap/strategies/interface.js](../src/services/ldap/strategies/interface.js) |
| General strategy | [src/services/ldap/strategies/general.js](../src/services/ldap/strategies/general.js) |
| Univention strategy | [src/services/ldap/strategies/univention.js](../src/services/ldap/strategies/univention.js) |
| Strategy selection | [src/services/ldap/strategies/index.js](../src/services/ldap/strategies/index.js) |
| Sync repo (school) | [src/services/sync/repo/school.repo.js](../src/services/sync/repo/school.repo.js) |
| Sync repo (user) | [src/services/sync/repo/user.repo.js](../src/services/sync/repo/user.repo.js) |
| Sync repo (class) | [src/services/sync/repo/class.repo.js](../src/services/sync/repo/class.repo.js) |
| UserAccount service | [src/services/sync/services/UserAccountService.js](../src/services/sync/services/UserAccountService.js) |

---

## 7. NestJS Sync Infrastructure

### 7.1 SyncModule

📁 [sync.module.ts](../apps/server/src/infra/sync/sync.module.ts)

The NestJS `SyncModule` lives in `@infra/sync` and provides the console command infrastructure for scheduled sync. Currently it only registers the TSP strategy, but the pattern is extensible.

> **Note:** The module itself has a TODO comment acknowledging it does not belong in `@infra` because it depends on `@modules`. It should be moved in a future refactoring.

```
SyncConsole (CLI: "sync run <target>")
    └─► SyncUc
        └─► SyncService
            └─► Map<SyncStrategyTarget, SyncStrategy>
                └─► TspSyncStrategy (if FEATURE_TSP_SYNC_ENABLED)
```

### 7.2 SyncStrategy Interface

📁 [sync-strategy.ts](../apps/server/src/infra/sync/strategy/sync-strategy.ts)

```typescript
abstract class SyncStrategy {
    abstract getType(): SyncStrategyTarget;
    abstract sync(): Promise<void>;
}
```

📁 [sync-strategy.types.ts](../apps/server/src/infra/sync/sync-strategy.types.ts)

```typescript
enum SyncStrategyTarget {
    TSP = 'tsp',
}
```

### 7.3 SynchronizationModule

📁 [synchronization.module.ts](../apps/server/src/modules/synchronization/synchronization.module.ts)

A separate `SynchronizationModule` exists for tracking sync execution metadata:

📁 [synchronization.do.ts](../apps/server/src/modules/synchronization/domain/do/synchronization.do.ts)

```typescript
class Synchronization extends DomainObject<SynchronizationProps> {
    systemId?: string
    count?: number
    failureCause?: string
    status?: SynchronizationStatusModel  // REGISTERED, etc.
}
```

This is used for auditing which syncs ran, when, and whether they succeeded.

---

## 8. Cross-System Comparison

### 8.1 Data Flow Comparison

| Aspect | TSP | Schulconnex (Moin.Schule) | LDAP |
|--------|-----|--------------------------|------|
| **Trigger** | Cron + login | Login only | Cron only |
| **Protocol** | REST API (OAuth2 CC) | Schulconnex REST (user token) | LDAP protocol |
| **Data fetch** | TSP API client (generated) | SchulconnexRestClient | ldapjs |
| **Producer side** | `TspSyncStrategy` | `SchulconnexAsyncProvisioningStrategy` | `LDAPSyncer` |
| **Queue** | No queue (direct batch) | RabbitMQ (groups/licenses) | RabbitMQ (all entities) |
| **Consumer side** | N/A (inline) | AMQP consumers | `LDAPSyncerConsumer` |
| **Codebase** | NestJS | NestJS | Feathers legacy |
| **Multi-school** | Yes | Yes (one per login) | Configurable |
| **Delta sync** | `daysToFetch` parameter | N/A (always current user) | Full sync each run |
| **School creation** | Yes (batch sync) | Yes (at login) | Yes (consumer) |
| **User deletion** | No | No (known limitation) | No |

### 8.2 Role Mapping Comparison

| External Role | TSP | Schulconnex | LDAP (Univention) | LDAP (General) |
|--------------|-----|-------------|-------------------|----------------|
| Student | `Schueler` | `Lern` | `ucsschoolStudent` objectClass | Configurable |
| Teacher | `Lehrer` | `Lehr` | `ucsschoolTeacher` objectClass | Configurable |
| Admin | `Admin` | `Leit` / `OrgAdmin` | `SchulCloudAdmin=TRUE` | Configurable |

### 8.3 Account Creation Comparison

| Aspect | TSP | Schulconnex | LDAP |
|--------|-----|-------------|------|
| Username | Email (`{externalId}@schul-cloud.org`) | SHA-256 hash of userId | `{schoolDn}/{ldapUID}` |
| Password | None (OAuth) | None (OAuth) | None (LDAP bind) |
| systemId | Set to TSP system | Set to Schulconnex system | Set to LDAP system |

---

## 9. Peripheral Topics (Brief References)

### 9.1 Erwin Strategy (Currently Disabled)

The Erwin provisioning strategy (`ErwinProvisioningStrategy`) exists in the codebase but is currently disabled with no concrete plans to enable it soon.

📁 [erwin.strategy.ts](../apps/server/src/modules/provisioning/strategy/erwin/erwin.strategy.ts)

It follows the same `ProvisioningStrategy` pattern and has its own payload types for schools, classes, and persons.

### 9.2 LDAP-to-Schulconnex User Migration (Historical)

The `user-import` module was built for the migration of schools from LDAP (Univention) to Schulconnex (Moin.Schule). This migration has been executed and is no longer an active concern. The module remains in the codebase in case it is needed again.

**Key concept:** During migration, LDAP sync creates `ImportUser` entities instead of real users. These import users are matched (automatically or manually) to Schulconnex users, and then migrated in a batch operation.

Relevant files if this comes up:

| Purpose | File |
|---------|------|
| Migration use case | [user-import.uc.ts](../apps/server/src/modules/user-import/uc/user-import.uc.ts) |
| Fetch use case | [user-import-fetch.uc.ts](../apps/server/src/modules/user-import/uc/user-import-fetch.uc.ts) |
| Import service | [user-import.service.ts](../apps/server/src/modules/user-import/service/user-import.service.ts) |
| Schulconnex fetch | [schulconnex-fetch-import-users.service.ts](../apps/server/src/modules/user-import/service/schulconnex-fetch-import-users.service.ts) |
| Module | [user-import.module.ts](../apps/server/src/modules/user-import/user-import.module.ts) |

### 9.3 OIDC Provisioning Strategy (Minimal)

The `OidcProvisioningStrategy` provides minimal provisioning — it only extracts an `external_sub` from the ID token and creates an `ExternalUserDto` with no roles. It does not provision schools, classes, or groups.

📁 [oidc.strategy.ts](../apps/server/src/modules/provisioning/strategy/oidc/oidc.strategy.ts)

---

## 10. Suggested Exploration Order

For hands-on exploration after this presentation:

1. **Start with the System entity:** Read `System` domain object and `LdapConfig` to understand how external systems are configured
2. **Understand the ProvisioningService dispatcher:** Read `ProvisioningService.getData()` and `.provisionData()` to see how strategies are selected
3. **Follow a TSP batch sync:** Trace `SyncConsole.startSync('tsp')` → `TspSyncStrategy.sync()` → `TspFetchService` → `TspOauthDataMapper` → `TspProvisioningService.provisionUserBatch()`
4. **Follow a Schulconnex login provisioning:** Trace `POST /authentication/oauth2` → `Oauth2ContextHelper` → `SchulconnexAsyncProvisioningStrategy.getData()` → `.apply()` → RabbitMQ producers → consumers
5. **Follow a TSP login provisioning:** Trace the same OAuth2 login path but with `TspProvisioningStrategy.getData()` → `.apply()` — compare with the batch path to see shared logic
6. **Explore the LDAP producer side:** Read `LDAPSystemSyncer` → `LDAPSyncer` → `SyncMessageBuilder` to see how LDAP data is fetched and queued
7. **Explore the LDAP consumer side:** Read `LDAPSyncerConsumer` → `SchoolAction` → `UserAction` → `ClassAction` to see how queued data is persisted
8. **Compare the two LDAP strategies:** Read `GeneralLDAPStrategy` vs `UniventionLDAPStrategy` side by side to understand the configurability vs. hardcoded approach
9. **Study the Schulconnex AMQP pipeline:** Trace from `SchulconnexGroupProvisioningProducer` → `SchulconnexGroupProvisioningConsumer` → `SchulconnexGroupProvisioningService.provisionExternalGroup()`

---

*Document prepared for technical handover, June 2026*
