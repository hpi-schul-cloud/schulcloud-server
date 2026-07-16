# Technical Handover: School Module

## Document Purpose & Structure

This document guides developers through the School Module as a **reference implementation** of the project's architecture. It's designed to be presented in a workshop setting. The focus is on technical structure, dependency design, and implementation patterns — not on functional features. After this workshop, you should be able to build a new module following the same patterns.

---

## 1. Overview & Role in the Architecture

### 1.1 Why the School Module?

The School Module was explicitly designed as a **positive example** of the target architecture. It demonstrates:

- Clean separation of domain, API, and persistence layers
- Dependency inversion between domain and repo
- Intelligent Domain Objects with business logic
- Proper entity mapping (DO ↔ Entity)
- Module split into domain module and API module
- Use of shared infrastructure (configuration, authorization, events)

### 1.2 Three Implementations of "School"

Schools exist in **three different implementations** in the codebase:

| Implementation | Location | Purpose |
|---|---|---|
| **School Module** (NestJS, new) | `apps/server/src/modules/school/` | New endpoints: get school, update school, maintenance mode, school years, system management, LDAP login info |
| **Legacy School Module** (NestJS, transitional) | `apps/server/src/modules/legacy-school/` | Admin-facing school management, school creation, more complex edit flows; uses older patterns (service layer, UCs, own entity definitions) |
| **Feathers School Service** (legacy) | `src/services/school/` | Original implementation; hooks-based, model.js, used by old clients |

The School Module (new) is the architectural target. The legacy implementations are being gradually migrated or replaced.

---

## 2. Module Split: Domain Module vs. API Module

A key pattern: the module is split into **two NestJS modules** with different responsibilities.

### 2.1 `SchoolModule` — The Domain Module

📁 [school.module.ts](../apps/server/src/modules/school/school.module.ts)

```typescript
@Module({
    imports: [SystemModule, AuthorizationModule, ConfigurationModule.register(...)],
    providers: [
        SchoolService, SchoolYearService, FederalStateService,
        { provide: SCHOOL_REPO, useClass: SchoolMikroOrmRepo },
        { provide: SCHOOL_YEAR_REPO, useClass: SchoolYearMikroOrmRepo },
        FederalStateRepo,
        SystemDeletedHandler,
        SchoolAuthorizableService,
    ],
    exports: [SchoolService, SchoolYearService, FederalStateService],
})
export class SchoolModule {}
```

**Responsibilities:**
- Owns the domain logic (services, DOs, factories, event handlers)
- Provides the repo implementations (but the domain depends only on the interface)
- Exports **services only** — no repo, no entity, no DO internals
- Can be imported by other modules that need school data

### 2.2 `SchoolApiModule` — The API Module

📁 [school-api.module.ts](../apps/server/src/modules/school/school-api.module.ts)

```typescript
@Module({
    imports: [SchoolModule, AuthorizationModule, ClassModule, UserModule, MoinSchuleClassModule],
    controllers: [SchoolController],
    providers: [SchoolUc],
})
export class SchoolApiModule {}
```

**Responsibilities:**
- Defines the HTTP controllers and use cases (UCs)
- Imports the domain module plus any other modules needed for orchestration
- Never exported or imported by other modules — it's a leaf

### 2.3 Why the Split?

- Other modules (e.g., provisioning, sync) can import `SchoolModule` to use `SchoolService` without pulling in HTTP concerns.
- The API layer (controller, UC, DTOs) is isolated — it can import multiple domain modules to orchestrate cross-cutting use cases, without introducing circular dependencies.

---

## 3. Folder Structure

```
modules/school/
├── index.ts                    # Public API of the module (for external imports)
├── school.module.ts            # Domain module definition
├── school-api.module.ts        # API module definition
├── school.config.ts            # Module-specific configuration (with validation)
│
├── domain/                     # All domain logic
│   ├── do/                     # Domain Objects (School, SchoolYear, FederalState, County)
│   ├── service/                # Domain services (SchoolService, SchoolYearService, etc.)
│   ├── interface/              # Repo interfaces + update body interface
│   ├── factory/                # SchoolFactory (builds DOs)
│   ├── type/                   # Enums and type definitions
│   ├── query/                  # Query types for repo methods
│   ├── helper/                 # Pure helper functions (e.g., SchoolYearHelper)
│   ├── loggable/               # LoggableExceptions for domain errors
│   ├── event-handler/          # Domain event handlers (e.g., SystemDeletedHandler)
│   └── index.ts                # Re-exports all domain public API
│
├── api/                        # HTTP layer
│   ├── school.controller.ts    # REST controller
│   ├── school.uc.ts            # Use case (orchestration)
│   ├── dto/                    # Request/Response DTOs (with swagger decorators)
│   ├── mapper/                 # DO → Response mappers
│   ├── test/                   # API integration tests
│   └── index.ts
│
├── repo/                       # Persistence layer
│   ├── school.entity.ts        # MikroORM entity (DB schema)
│   ├── school.repo.ts          # Repo implementation (implements domain interface)
│   ├── mapper/                 # Entity ↔ DO mappers
│   ├── scope/                  # Query scopes (reusable query builders)
│   └── ...                     # Other entities (FederalState, SchoolYear, StorageProvider)
│
└── testing/                    # Test factories (for use in other modules' tests)
```

### 3.1 Key Observation: What's in `index.ts`

📁 [index.ts](../apps/server/src/modules/school/index.ts)

The module's public API is extremely narrow:

```typescript
export { School, SchoolFactory, SchoolFeature, SchoolService, SchoolYearService, ... } from './domain';
export { SchoolModule } from './school.module';
```

Only domain types and the module itself are exported. Entities, repos, and internal helpers are **never** part of the public API.

---

## 4. Dependency Inversion: Domain ↔ Repo

This is the most important architectural pattern in the module.

### 4.1 The Interface Lives in the Domain

📁 [school.repo.interface.ts](../apps/server/src/modules/school/domain/interface/school.repo.interface.ts)

```typescript
export interface SchoolRepo {
    getSchoolById(schoolId: EntityId): Promise<School>;
    getSchools(query: SchoolQuery, options?: IFindOptions<SchoolProps>): Promise<School[]>;
    save(domainObject: School): Promise<School>;
    // ...
}

export const SCHOOL_REPO = 'SCHOOL_REPO';
```

The **domain defines what it needs** from persistence. The interface references only domain types (`School`, `SchoolQuery`, `EntityId`). It knows nothing about MikroORM, entities, or databases.

### 4.2 The Repo Implements the Interface

📁 [school.repo.ts](../apps/server/src/modules/school/repo/school.repo.ts)

```typescript
@Injectable()
export class SchoolMikroOrmRepo
    extends BaseDomainObjectRepo<School, SchoolEntity>
    implements SchoolRepo {
    // ...
}
```

The repo layer depends on the domain (imports `School`, `SchoolRepo`), not the other way around.

### 4.3 Wiring via Token-Based DI

In `school.module.ts`:
```typescript
{ provide: SCHOOL_REPO, useClass: SchoolMikroOrmRepo }
```

In `SchoolService`:
```typescript
constructor(@Inject(SCHOOL_REPO) private readonly schoolRepo: SchoolRepo) {}
```

**Consequence:** The domain layer has zero imports from the repo layer. The dependency arrow points **inward** (repo → domain), not outward. This is classic Dependency Inversion Principle / Hexagonal Architecture.

### 4.4 Dependency Graph

```
┌──────────────┐
│   API Layer  │  (Controller, UC, DTOs)
│              │  Depends on: Domain, Authorization, other modules
└──────┬───────┘
       │ imports
       ▼
┌──────────────┐
│Domain Layer  │  (Services, DOs, Interfaces, Factories)
│              │  Depends on: nothing from repo layer
└──────────────┘
       ▲ implements
       │
┌──────────────┐
│  Repo Layer  │  (Entities, Mappers, Scopes, MikroORM)
│              │  Depends on: Domain (imports DO, interface)
└──────────────┘
```

---

## 5. Domain Objects: Intelligent DOs

### 5.1 The `School` DO

📁 [school.ts](../apps/server/src/modules/school/domain/do/school.ts)

The `School` class extends `DomainObject<SchoolProps>` and encapsulates **business rules**:

| Method | Business Rule |
|--------|--------------|
| `updateCounty(countyId)` | County can only be set once; must match the school's federal state |
| `updateOfficialSchoolNumber(num)` | Can only be set once (immutable after first assignment) |
| `isInMaintenance()` | Checks `inMaintenanceSince` against current date |
| `isExternal()` | True if school has an `externalId` |
| `isEligibleForExternalInvite(ownSchoolId)` | Excludes tombstone/external-person schools and self |
| `removeSystem(systemId)` | Removes a system from the school's system list |
| `addInstanceFeature(feature)` / `removeInstanceFeature(feature)` | Manages computed feature set |

**Key insight:** The DO is not an anemic data bag. It contains validation logic, invariants, and state transitions. The service layer calls these methods rather than manipulating props directly.

### 5.2 SchoolProps

```typescript
export interface SchoolProps extends AuthorizableObject {
    id: EntityId;
    name: string;
    officialSchoolNumber?: string;
    systemIds: EntityId[];
    features: Set<SchoolFeature>;
    federalState?: FederalState;
    currentYear?: SchoolYear;
    county?: County;
    // ...
}
```

Props are a plain interface. The DO wraps them and controls access via getters/setters and methods.

### 5.3 SchoolFactory

📁 [school.factory.ts](../apps/server/src/modules/school/domain/factory/school.factory.ts)

Two responsibilities:
1. `build(props)` — constructs a `School` from raw props (used by the mapper)
2. `buildFromPartialBody(school, body)` — applies a partial update to an existing school, using the DO's own validation methods (e.g., `updateCounty`)

---

## 6. Entity Mapping

### 6.1 The Entity (Persistence Model)

📁 [school.entity.ts](../apps/server/src/modules/school/repo/school.entity.ts)

The `SchoolEntity` is a MikroORM entity that maps to the `schools` MongoDB collection. It has:
- MikroORM decorators (`@Property`, `@ManyToOne`, `@ManyToMany`, etc.)
- DB-specific field names (e.g., `fieldName: 'ldapSchoolIdentifier'` for `externalId`)
- Relations as MikroORM `Collection` / references

**The entity is an implementation detail of the repo layer. It is never used outside the repo.**

### 6.2 The Mapper

📁 [school.entity.mapper.ts](../apps/server/src/modules/school/repo/mapper/school.entity.mapper.ts)

Two static methods:

| Method | Direction | Used by |
|--------|-----------|---------|
| `mapToDo(entity)` | Entity → DO | Repo read methods |
| `mapToEntityProperties(do, em)` | DO → EntityData | Repo save method |

The mapper uses `SchoolFactory.build(...)` to construct the DO, ensuring all DOs are created consistently.

For the reverse direction, it uses `em.getReference(...)` to create lightweight entity references (e.g., for `federalState`, `currentYear`, `systems`) without loading them.

### 6.3 BaseDomainObjectRepo

📁 [base-domain-object.repo.ts](../apps/server/src/shared/repo/base-domain-object.repo.ts)

The `SchoolMikroOrmRepo` extends this abstract base class which provides:
- `save(domainObject)` — create or update (upsert pattern)
- `saveAll(domainObjects)` — batch save
- `delete(domainObjects)` — remove by ID

Subclasses must implement:
- `entityName` — which MikroORM entity to use
- `mapDOToEntityProperties(do)` — how to convert DO → entity data

**Critical detail: Merging with MikroORM's Unit of Work**

The `save()` method does not simply persist the entity data. It first checks whether an entity with the same ID already exists in MikroORM's identity map (unit of work). If it does, the existing managed entity is updated via `em.assign()`; if not, a new entity is created via `em.create()`. This merge step ensures that:

1. **No duplicate entities** exist in the identity map for the same database record — MikroORM would throw if you tried to persist a second unmanaged entity with the same primary key.
2. **Change detection works correctly** — MikroORM's unit of work tracks changes on managed entities. By assigning properties to the existing tracked entity rather than replacing it, the flush produces a minimal, correct update query.
3. **Relations remain consistent** — other entities in the identity map that hold references to the school entity keep pointing to the same managed instance.

Without this merge, you would encounter subtle bugs: stale data overwrites, phantom duplicate inserts, or "entity already managed" errors — especially in request-scoped `EntityManager` contexts where multiple operations touch the same record.

---

## 7. API Layer

### 7.1 Controller

📁 [school.controller.ts](../apps/server/src/modules/school/api/school.controller.ts)

Pure HTTP concern: routing, swagger decorators, parameter extraction. Delegates everything to the UC. No business logic.

### 7.2 Use Case (UC)

📁 [school.uc.ts](../apps/server/src/modules/school/api/school.uc.ts)

Orchestrates:
1. Load data via domain services
2. Check authorization
3. Apply business operations
4. Map to response DTOs

The UC can import multiple domain services (from this module and others). It lives in the API layer, not the domain layer.

### 7.3 DTOs and Response Mappers

- **Request DTOs** (`dto/`): NestJS class-validator decorated classes for input validation
- **Response DTOs** (`dto/`): Swagger-decorated classes for API output
- **Response Mappers** (`mapper/`): Static mapper classes that convert DOs → Response DTOs

---

## 8. Configuration

📁 [school.config.ts](../apps/server/src/modules/school/school.config.ts)

```typescript
export const SCHOOL_CONFIG_TOKEN = 'SCHOOL_CONFIG_TOKEN';

@Configuration()
export class SchoolConfig {
    @ConfigProperty('STUDENT_TEAM_CREATION')
    @IsEnum(StudentTeamCreationOption)
    public studentTeamCreation = StudentTeamCreationOption.OPT_OUT;

    @IsOptional()
    @IsString()
    @ConfigProperty('S3_KEY')
    public S3_KEY?: string;
}
```

Uses the `@infra/configuration` module with:
- A unique token (`SCHOOL_CONFIG_TOKEN`) for DI
- Class-validator decorators for runtime validation
- Registered in the module via `ConfigurationModule.register(SCHOOL_CONFIG_TOKEN, SchoolConfig)`
- Injected in services via `@Inject(SCHOOL_CONFIG_TOKEN) private readonly config: SchoolConfig`

---

## 9. Domain Events

📁 [system-deleted.handler.ts](../apps/server/src/modules/school/domain/event-handler/system-deleted.handler.ts)

```typescript
@EventsHandler(SystemDeletedEvent)
export class SystemDeletedHandler implements IEventHandler<SystemDeletedEvent> {
    constructor(private readonly schoolService: SchoolService) {}

    public async handle(event: SystemDeletedEvent): Promise<void> {
        const school = await this.schoolService.getSchoolById(event.schoolId);
        school.removeSystem(event.system.id);
        // ...
        await this.schoolService.save(school);
    }
}
```

Pattern: The handler listens to a domain event from another module (`SystemModule`), loads the relevant DO, calls its business methods, and saves. This enables loose coupling between modules.

---

## 10. Query Scopes

📁 [school.scope.ts](../apps/server/src/modules/school/repo/scope/school.scope.ts)

Scopes are reusable query builders for the repo layer. They allow composing complex queries from simple, testable building blocks:

```typescript
const scope = new SchoolScope();
scope.byFederalState(query.federalStateId);
scope.byExternalId(query.externalId);
scope.bySystemId(query.systemId);
```

---

## 11. Testing Factories

📁 `testing/`

The `testing/` folder contains **factory functions** for creating test DOs and entities. These are exported so other modules can create school test data without knowing internal details:

- `school.factory.ts` — creates `School` DOs for tests
- `school-entity.factory.ts` — creates `SchoolEntity` instances
- `federal-state.do.factory.ts`, `school-year.do.factory.ts`, etc.

---

## 12. Loggable Exceptions

📁 `domain/loggable/`

Following the project's logging pattern, domain errors are `LoggableExceptions`:

- `SchoolAlreadyInMaintenanceLoggableException`
- `SchoolNotInMaintenanceLoggableException`
- `SystemNotFoundLoggableException`
- `SystemCanNotBeDeletedLoggableException`
- etc.

These extend an HTTP exception and implement `Loggable`, so the error pipeline automatically logs them with structured data.

---

## 13. Authorization

The module provides a `SchoolAuthorizableService` that implements the authorization module's interface, enabling the authorization framework to load schools and check permissions against them. The `School` DO extends `DomainObject<SchoolProps>` where `SchoolProps extends AuthorizableObject`, making it compatible with the authorization system.

---

## 14. Legacy Implementations

### 14.1 Legacy School Module (`modules/legacy-school/`)

- Older NestJS module with its own entity definitions, service layer, and UCs
- Handles admin-facing school management (creation, more complex edits)
- Has its own controller (`legacy-school.api-module.ts`, `legacy-school-admin.api-module.ts`)
- Uses a different internal structure (separate `entity/`, `service/`, `uc/` folders instead of a unified `domain/`)
- Still actively used; not yet migrated to the new pattern

### 14.2 Feathers School Service (`src/services/school/`)

- Original Express/Feathers implementation
- `model.js` defines the Mongoose schema
- `hooks/` contains before/after hooks for CRUD operations
- `maintenance.js` handles maintenance mode in the legacy API
- Used by legacy frontend clients
- Being gradually replaced by NestJS endpoints

---

## 15. Summary: How to Build a New Module

Based on this module, the recipe for a new module is:

1. **Create the domain layer first** — define your DO (`domain/do/`), its props interface, and its business methods
2. **Define the repo interface** in `domain/interface/` — only domain types, no persistence details
3. **Create the domain service** in `domain/service/` — inject the repo via token, orchestrate DO operations
4. **Create the domain module** — wire the token to the repo implementation, export only services
5. **Build the repo layer** — entity, mapper (Entity ↔ DO), scope, repo class implementing the domain interface
6. **Build the API layer** — controller, UC, DTOs, response mappers; put it in a separate API module
7. **Add configuration** if needed — use `@Configuration()` + token + `ConfigurationModule.register()`
8. **Add event handlers** for cross-module communication
9. **Add loggable exceptions** for domain errors
10. **Add testing factories** in `testing/` for other modules to use

---

## 16. Suggested Exploration Order

1. **Start with the DO:** Read `domain/do/school.ts` — understand `SchoolProps`, getters/setters, business methods
2. **Read the repo interface:** `domain/interface/school.repo.interface.ts` — see what the domain expects from persistence
3. **Read the service:** `domain/service/school.service.ts` — how it uses the repo and DO methods
4. **Trace the DI wiring:** `school.module.ts` — token-based injection of the repo
5. **Read the entity:** `repo/school.entity.ts` — compare with the DO; note the DB-specific concerns
6. **Read the mapper:** `repo/mapper/school.entity.mapper.ts` — the translation between the two worlds
7. **Read the repo implementation:** `repo/school.repo.ts` — how it uses MikroORM + mapper + scopes
8. **Read the UC:** `api/school.uc.ts` — how it orchestrates authorization + domain services + response mapping
9. **Read the controller:** `api/school.controller.ts` — thin HTTP layer
10. **Look at the event handler:** `domain/event-handler/system-deleted.handler.ts` — cross-module communication
11. **Compare with legacy:** Skim `modules/legacy-school/` to see the contrast

---

*Document prepared for technical handover workshop, July 2026*
