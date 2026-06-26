# Technical Handover: Class Module

## Document Purpose & Structure

This document guides new developers through the Class-related codebase. It's designed to be presented by someone familiar with the code, not read in isolation. The structure follows a logical learning path: concepts → data model → split implementation → consumers → year transitions → practical guidance.

---

## 1. Overview & Conceptual Foundation

### 1.1 What is a Class?

A **Class** ("Klasse" in German) is a school-organizational grouping of students, typically representing a real-world school class like "7a" or "10b". Classes exist at the school level and serve as a way to organize students and teachers.

**Key characteristics:**
- A class belongs to exactly one **School**
- It has a **name** (e.g., "a", "b") and optionally a **grade level** (1–13)
- The display name is the concatenation: grade level + name → "7a"
- It references **students** (`userIds`) and **teachers** (`teacherIds`)
- It can be linked to a **school year**
- It can have a **successor** class (for year transitions: 7a → 8a)
- It can be **externally sourced** (e.g., synced from TSP or LDAP)

### 1.2 Classes vs. Groups

⚠️ **There are two concepts that represent "classes" in the system:**

| Concept | Module | Origin | Still Created? |
|---------|--------|--------|----------------|
| **Class** (legacy) | `ClassModule` | Manual creation, LDAP sync, TSP sync | Yes – via Feathers API, TSP provisioning |
| **Group** of type `CLASS` | `GroupModule` | External provisioning (Schulconnex / Moin.Schule) | Yes – via provisioning strategies |

The `ClassGroupUc` in the `GroupModule` **merges both** into a unified list for the frontend. The frontend calls `GET /groups/class` and receives a combined, sorted list of legacy `Class` objects and `Group` objects of type `CLASS`.

```
┌──────────────────────────────────────────────────────────────────┐
│ Frontend: "Klassen" view                                         │
│                                                                  │
│  GET /groups/class                                               │
├──────────────────────────────────────────────────────────────────┤
│ ClassGroupUc.findAllClasses()                                    │
│                                                                  │
│  ┌───────────────────────┐   ┌────────────────────────────────┐  │
│  │ ClassService.find()   │   │ GroupService.findByScope()     │  │
│  │ → Class DO instances  │   │ → Group DOs (type = CLASS)    │  │
│  │ (ClassRootType.CLASS) │   │ (ClassRootType.GROUP)         │  │
│  └───────────┬───────────┘   └──────────────┬─────────────────┘  │
│              │                              │                    │
│              └──────────┬───────────────────┘                    │
│                         ▼                                        │
│              Combined, sorted, paginated                         │
│              → ClassInfoSearchListResponse                       │
└──────────────────────────────────────────────────────────────────┘
```

### 1.3 How Classes Relate to Other Entities

| Concept | Relationship |
|---------|-------------|
| **School** | Parent – a class belongs to exactly one school |
| **SchoolYear** | Optional – a class can be associated with a specific school year |
| **Course** | Courses reference classes via `classIds` – all students in those classes are implicit course members |
| **User (Student)** | `userIds` – students assigned to the class |
| **User (Teacher)** | `teacherIds` – teachers assigned to the class |
| **Successor Class** | A class can link to its next-year version (year transition) |
| **Group** | The newer, externally-provisioned counterpart of a class |

### 1.4 Key Architectural Fact: Split Implementation

⚠️ **Like other entities, classes are split across Feathers and NestJS:**

| System | What it handles |
|--------|----------------|
| **Legacy Feathers** (`src/services/user-group/`) | Full CRUD API (create, find, update, patch, remove), successor logic, permission hooks |
| **NestJS** (`apps/server/src/modules/class/`) | Domain object, service, repo, user deletion saga – **no own API controller** |

```
┌──────────────────────────────────────────────────────────────────┐
│ Frontend                                                          │
├───────────────────────────┬──────────────────────────────────────┤
│ /classes (full CRUD)      │ /groups/class (class list)            │
│ /classes/successor        │ /courses (classIds on courses)        │
│                           │ /schools/:id/students (class filter)  │
├───────────────────────────┼──────────────────────────────────────┤
│ Feathers Service          │ NestJS ClassModule (no controller)    │
│ (src/services/user-group/)│ Consumed by: GroupApiModule,          │
│                           │ CourseApiModule, SchoolApiModule,     │
│                           │ ProvisioningModule, LearnroomModule   │
└───────────────────────────┴──────────────────────────────────────┘
                    │                       │
        ┌───────────┴───────────────────────┴──────────┐
        │     Shared MongoDB collection: `classes`      │
        └──────────────────────────────────────────────┘
```

**Important:** The NestJS `ClassModule` has **no API controller** of its own. It is a pure domain module consumed by other NestJS modules. All direct class CRUD from the frontend goes through Feathers.

---

## 2. Data Model

### 2.1 Class Entity (MikroORM)

📁 [class.entity.ts](../apps/server/src/modules/class/entity/class.entity.ts)

```typescript
@Entity({ tableName: 'classes' })
@Index({ properties: ['year', 'ldapDN'] })
export class ClassEntity extends BaseEntityWithTimestamps {
    name: string                         // Class name suffix (e.g., "a", "b")
    schoolId: ObjectId                   // Parent school (required)
    userIds?: ObjectId[]                 // Student IDs
    teacherIds: ObjectId[]               // Teacher IDs
    invitationLink?: string              // Invitation URL
    year?: ObjectId                      // School year reference
    gradeLevel?: number                  // Grade level (1–13)
    ldapDN?: string                      // LDAP distinguished name (for sync)
    successor?: ObjectId                 // Next-year class reference
    source?: string                      // External source system (e.g., "tsp")
    sourceOptions?: ClassSourceOptionsEntity  // Source-specific data (embedded)
}
```

**Indexes:**
- `schoolId` (from base schema)
- `userIds` (from base schema)
- `teacherIds`
- `source`
- `{ year, ldapDN }` (compound – used for LDAP sync)

### 2.2 Class Domain Object

📁 [class.do.ts](../apps/server/src/modules/class/domain/class.do.ts)

The `Class` DO extends `DomainObject<ClassProps>` and provides:

```typescript
export class Class extends DomainObject<ClassProps> {
    // Getters/setters for all properties
    get name(): string
    get schoolId(): EntityId
    get userIds(): EntityId[]
    get teacherIds(): EntityId[]
    get year(): EntityId | undefined
    get gradeLevel(): number | undefined
    get successor(): EntityId | undefined
    get source(): string | undefined
    get sourceOptions(): ClassSourceOptions | undefined

    // Mutation methods
    addTeacher(teacherId: EntityId): void     // Idempotent add
    addUser(userId: EntityId): void           // Idempotent add
    removeUser(userId: string): void
    clearParticipants(): void                 // Clears both teachers and users

    // Display
    getClassFullName(): string                // "7a" or "name" if no gradeLevel
}
```

### 2.3 ClassSourceOptions

📁 [class-source-options.do.ts](../apps/server/src/modules/class/domain/class-source-options.do.ts)
📁 [class-source-options.entity.ts](../apps/server/src/modules/class/entity/class-source-options.entity.ts)

An embedded object that stores external-source-specific metadata:

```typescript
export class ClassSourceOptions {
    tspUid?: string    // TSP external ID for the class
}
```

The entity uses `@Embedded(() => ClassSourceOptionsEntity, { object: true })` so it is stored as a nested document, not a separate collection.

### 2.4 ClassFactory (Domain)

📁 [class.factory.ts](../apps/server/src/modules/class/domain/class.factory.ts)

Production factory for creating new `Class` domain objects with sensible defaults:

```typescript
ClassFactory.create({
    name: 'a',
    gradeLevel: 7,
    schoolId: school.id,
    year: school.currentYear?.id,
    sourceOptions: new ClassSourceOptions({ tspUid: '...' }),
})
```

### 2.5 MongoDB Schema (Legacy Feathers)

📁 [model.js](../src/services/user-group/model.js)

The Mongoose `classSchema` extends a shared `getUserGroupSchema` (common base with courses and courseGroups) and adds class-specific fields. Notable differences from the MikroORM entity:

- Uses the `externalSourceSchema` mixin (`source` + `sourceOptions` as plain `Object`)
- Has a **virtual** `displayName` getter: `gradeLevel + name` (e.g., "7a")
- `gradeLevel` validation: min 1, max 13
- `successor` references `'classes'` collection
- `name` is **not required** in the Mongoose schema (unlike the entity where it has `@Property()`)

### 2.6 Display Name Logic

Both systems compute the display name the same way, but in different locations:

| System | Implementation |
|--------|---------------|
| Feathers | `classSchema.virtual('displayName')` in `model.js` |
| NestJS (DO) | `Class.getClassFullName()` method |
| NestJS (ClassGroupUc) | Inline: `` `${clazz.gradeLevel}${clazz.name}` `` |

---

## 3. NestJS Module Architecture

### 3.1 Module Structure

📁 [class.module.ts](../apps/server/src/modules/class/class.module.ts)

```typescript
@Module({
    imports: [LoggerModule, SagaModule],
    providers: [ClassService, ClassesRepo, DeleteUserClassDataStep, UserChangedSchoolHandlerService],
    exports: [ClassService],
})
export class ClassModule {}
```

**Key observations:**
- No API module – this is a pure domain module
- No authorization rule – classes are not directly authorized in NestJS; authorization is handled by the consuming modules (e.g., `SchoolRule` for school context, `GroupRule` for class lists)
- Exports only `ClassService`

### 3.2 Directory Structure

```
modules/class/
├── class.module.ts                    # Module definition
├── index.ts                           # Public exports
├── domain/
│   ├── class.do.ts                    # Domain object
│   ├── class.do.spec.ts
│   ├── class-source-options.do.ts     # Embedded source options DO
│   ├── class.factory.ts              # Production factory (create new classes)
│   ├── index.ts
│   └── testing/
│       ├── factory/
│       │   └── class.factory.ts      # Test factory (DoBaseFactory)
│       └── *.spec.ts
├── entity/
│   ├── class.entity.ts               # MikroORM entity
│   ├── class-source-options.entity.ts # Embedded entity
│   ├── index.ts
│   └── testing/
│       └── factory/
│           └── class.entity.factory.ts
├── repo/
│   ├── classes.repo.ts               # Repository
│   ├── classes.repo.integration.spec.ts
│   ├── class.scope.ts                # Query scope builder
│   ├── class.scope.spec.ts
│   ├── index.ts
│   └── mapper/
│       ├── class.mapper.ts           # Entity ↔ DO mapping
│       └── class.mapper.spec.ts
├── service/
│   ├── class.service.ts              # Domain service
│   ├── class.service.spec.ts
│   ├── user-changed-school-handler.service.ts  # Event handler
│   ├── user-changed-school-handler.service.spec.ts
│   └── index.ts
└── saga/
    ├── delete-user-class-data.step.ts  # User deletion cleanup
    ├── delete-user-class-data.step.spec.ts
    └── index.ts
```

### 3.3 ClassService

📁 [class.service.ts](../apps/server/src/modules/class/service/class.service.ts)

| Method | Purpose |
|--------|---------|
| `find(scope)` | Find classes matching a `ClassScope` query |
| `findClassesForSchool(schoolId)` | All classes for a school |
| `findAllByUserId(userId)` | Classes where user is student or teacher |
| `findClassWithSchoolIdAndExternalId(schoolId, externalId)` | Lookup by TSP UID (for provisioning) |
| `findById(id)` | Single class by ID (throws if not found) |
| `findExistingClassesByIds(classIds)` | Batch load, silently skips missing IDs |
| `save(classes)` | Persist one or more classes (upsert) |

### 3.4 ClassesRepo

📁 [classes.repo.ts](../apps/server/src/modules/class/repo/classes.repo.ts)

| Method | Purpose |
|--------|---------|
| `find(scope)` | Query by `ClassScope` |
| `findAllBySchoolId(schoolId)` | All classes for a school |
| `findAllByUserId(userId)` | `$or: [{ userIds }, { teacherIds }]` |
| `findClassWithSchoolIdAndExternalId(...)` | Match by `schoolId` + `sourceOptions.tspUid` |
| `findClassById(id)` | Returns `null` if not found |
| `save(classes)` | `em.upsertMany()` + `em.flush()` |
| `removeUserReference(userId, classIds?)` | `$pull` user from both `userIds` and `teacherIds` |

### 3.5 ClassScope

📁 [class.scope.ts](../apps/server/src/modules/class/repo/class.scope.ts)

```typescript
class ClassScope extends Scope<ClassEntity> {
    bySchoolId(schoolId?: EntityId)  // Filter by school
    byUserId(userId?: EntityId)      // Filter by membership ($or userIds/teacherIds)
}
```

### 3.6 ClassMapper

📁 [class.mapper.ts](../apps/server/src/modules/class/repo/mapper/class.mapper.ts)

Bidirectional mapping between `ClassEntity` (MikroORM, uses `ObjectId`) and `Class` DO (uses `string` EntityIds). Handles `ObjectId ↔ string` conversions for all reference fields.

---

## 4. Legacy Feathers Implementation

### 4.1 Service Structure

📁 [src/services/user-group/](../src/services/user-group/)

Classes live in the `user-group` service alongside courses and courseGroups. This is a shared service file.

| Route | Service | Purpose |
|-------|---------|---------|
| `/classModel` | Mongoose model service | Internal – raw model CRUD (disallowed for external) |
| `/classes` | `Classes` service class | Public CRUD with hooks, delegates to `/classModel` |
| `/classes/successor` | `ClassSuccessorService` | Year transition – compute/find successor classes |

### 4.2 The Classes Service

📁 [classes.js](../src/services/user-group/services/classes.js)

A thin wrapper around `/classModel` that adds:
- **Year-based sorting:** If the query sorts by `year`, it fetches classes grouped by school year
- **Pagination:** Manual pagination via `paginate()` utility
- All real CRUD delegates to the `classModel` service

### 4.3 Feathers Hooks

📁 [hooks/classes.js](../src/services/user-group/hooks/classes.js)

**Before hooks:**

| Hook | Trigger | What it does |
|------|---------|--------------|
| `authenticate('jwt')` | before all | Require authentication |
| `hasPermission('CLASS_VIEW')` | before find | Require CLASS_VIEW permission |
| `hasPermission('CLASS_CREATE')` | before create | Require CLASS_CREATE permission |
| `hasPermission('CLASS_EDIT')` | before update/patch | Require CLASS_EDIT permission |
| `hasPermission('CLASS_REMOVE')` | before remove | Require CLASS_REMOVE permission |
| `restrictToCurrentSchool` | before find/get/create/update/patch/remove | Users can only see their own school's classes |
| `restrictFINDToClassesTheUserIsAllowedToSee` | before find | Filter classes to those the user is a member of (unless admin/superhero or teacher with STUDENT_LIST permission) |
| `restrictToUsersOwnClasses` | before get/update/patch/remove | Verifies user is a member of the specific class |
| `sortByGradeAndOrName` | before find | Default sort: `{ year: 1, gradeLevel: 1, name: 1 }` |
| `addCollation` | before find | Locale-aware string sorting |
| `mapPaginationQuery` | before find | Pagination normalization |
| `prepareGradeLevelUnset` | before update/patch | If `gradeLevel` is cleared but `name` is set, generates `$unset` |
| `permitGroupOperation` | before patch/remove | Allows batch operations |

**After hooks:**

| Hook | Trigger | What it does |
|------|---------|--------------|
| `denyIfNotCurrentSchool` | after get | Secondary check – rejects if class belongs to different school |
| `saveSuccessor` | after create | If `data.predecessor` is set, patches the predecessor's `successor` field |

### 4.4 Permission Model

| Operation | Required Permission |
|-----------|-------------------|
| Find (list) | `CLASS_VIEW` |
| Get (single) | (authenticated, own school, own class) |
| Create | `CLASS_CREATE` |
| Update / Patch | `CLASS_EDIT` |
| Remove | `CLASS_REMOVE` |

Admins and superheros bypass the "own classes" restriction. Teachers with `STUDENT_LIST` school permission can see all classes at their school.

### 4.5 Class Name Parsing Logic

📁 [logic/classes.js](../src/services/user-group/logic/classes.js)

A utility that parses a string class name (e.g., "7a") into structured data:

```javascript
classObjectFromName("7a")   → { name: "a", gradeLevel: 7 }
classObjectFromName("10b")  → { name: "b", gradeLevel: 10 }
classObjectFromName("SomeClass") → { name: "SomeClass" }
```

Uses regex: if the string starts with a number 1–13, it's extracted as `gradeLevel`, and the remainder becomes the `name`.

---

## 5. Year Transition (Class Successor)

### 5.1 Concept

At the end of a school year, classes advance to the next year. "Class 7a" becomes "Class 8a". The system supports this through a **successor** mechanism:

```
┌──────────────────┐      successor      ┌──────────────────┐
│ Class: 7a        │ ──────────────────► │ Class: 8a        │
│ Year: 2024/25    │                     │ Year: 2025/26    │
│ gradeLevel: 7    │                     │ gradeLevel: 8    │
│ students: [...]  │                     │ students: [...]  │
└──────────────────┘                     └──────────────────┘
      predecessor                             (new class)
```

### 5.2 ClassSuccessorService

📁 [classSuccessor.js](../src/services/user-group/services/classSuccessor.js)

This is entirely in Feathers. It does **not** create successor classes – it only **computes** what a successor would look like.

**`GET /classes/successor/:classId`** returns a suggested successor:
1. Loads the current class
2. Increments `gradeLevel` by 1 (fails if already 13)
3. Looks up the next school year
4. Copies `teacherIds` and `userIds`
5. Checks for **duplicates** (existing classes with same name/grade/year)
6. Returns the suggested data (without creating it)

**`GET /classes/successor?classIds=[...]`** returns suggestions for multiple classes at once.

**Actual creation** happens when the frontend takes the suggestion and calls `POST /classes` with `predecessor` in the data. The `saveSuccessor` after-hook then patches the old class's `successor` field.

### 5.3 Event: Class Removal

When a class is deleted, the `ClassSuccessorService` listens for the `removed` event and clears the `successor` reference on any predecessor class that pointed to the deleted class.

### 5.4 Hooks

📁 [hooks/classSuccessor.js](../src/services/user-group/hooks/classSuccessor.js)

- Only `find` and `get` are allowed (require `CLASS_CREATE` permission)
- `create`, `update`, `patch`, `remove` are all **disallowed**

---

## 6. Event Handling & User Lifecycle

### 6.1 User Deletion (Saga Step)

📁 [delete-user-class-data.step.ts](../apps/server/src/modules/class/saga/delete-user-class-data.step.ts)

When a user is deleted:
1. Find all classes where the user appears in `userIds` or `teacherIds`
2. Use `removeUserReference()` to `$pull` the user from both arrays
3. Report the number of modified classes

**Note:** This does **not** delete classes – it only removes the user's membership.

### 6.2 User Changed School (Event Handler)

📁 [user-changed-school-handler.service.ts](../apps/server/src/modules/class/service/user-changed-school-handler.service.ts)

Listens for `UserChangedSchoolEvent` (CQRS event). When a user transfers to a different school:
1. Find all classes the user belongs to
2. Remove the user from all those classes

This ensures a student who changes schools is automatically removed from their old school's classes.

---

## 7. Consumer Modules

The `ClassModule` is imported and used by several other NestJS modules. These consumers are covered in detail in their own handover workshops; here is a summary of how they use classes:

### 7.1 GroupApiModule – Class List

📁 [class-group.uc.ts](../apps/server/src/modules/group/uc/class-group.uc.ts)
📁 [group.controller.ts](../apps/server/src/modules/group/controller/group.controller.ts)

**Endpoint:** `GET /groups/class`

The `ClassGroupUc` merges legacy `Class` objects and `Group` objects (of type `CLASS`) into a unified class list for the frontend. Each entry gets a `ClassRootType` discriminator (`CLASS` or `GROUP`) so the frontend knows which system it came from.

Key logic:
- Loads classes via `ClassService.find(scope)` with school and optional user filters
- Loads groups via `GroupService.findByScope()` with types `[CLASS, COURSE, OTHER]`
- Resolves teacher names and student counts for both
- Determines `isUpgradable` for legacy classes (grade < 13, no successor yet)
- Supports filtering by `SchoolYearQueryType` (current, next, previous)
- Combined list is sorted and paginated

### 7.2 CourseApiModule – Class Names on Courses

📁 [course-info.uc.ts](../apps/server/src/modules/course/api/course-info.uc.ts)

Uses `ClassService.findExistingClassesByIds()` to resolve class names displayed alongside course information (e.g., "Mathe – 7a, 7b").

### 7.3 SchoolApiModule – Student Filtering

📁 [school.uc.ts](../apps/server/src/modules/school/api/school.uc.ts)

When listing students for a school, if the requesting user doesn't have the `STUDENT_LIST` permission, students are filtered to only those sharing classes with the requesting user. Uses `ClassService.findAllByUserId()`.

### 7.4 MoinSchuleClassModule

📁 [moin-schule-class.service.ts](../apps/server/src/modules/class-moin-schule/moin-schule-class.service.ts)

A thin adapter that queries `GroupService` for groups of type `CLASS` by user ID. Used by `SchoolUc` to also include Moin.Schule-synced classes when filtering students.

### 7.5 ProvisioningModule – External Sync

📁 [tsp-provisioning.service.ts](../apps/server/src/modules/provisioning/service/tsp-provisioning.service.ts)
📁 [class-provisioning-handler.ts](../apps/server/src/modules/provisioning/service/class-provisioning-handler.ts)

Classes can be created and updated by external provisioning systems (TSP, Erwin). The provisioning module uses `ClassService` and `ClassFactory` to create/update classes with external source information. See the **Sync Flows Handover** for details.

### 7.6 LearnroomModule – Course Membership

The `LearnroomModule` imports `ClassModule` to resolve class-based course memberships.

---

## 8. API Endpoints Summary

### Feathers API (Legacy) – Direct Class CRUD

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/classes?schoolId=` | List classes for a school (with year sorting) |
| GET | `/classes/:id` | Get a single class |
| POST | `/classes` | Create a new class |
| PUT | `/classes/:id` | Update a class |
| PATCH | `/classes/:id` | Patch class fields |
| DELETE | `/classes/:id` | Remove a class |
| GET | `/classes/successor/:id` | Get successor suggestion for a class |
| GET | `/classes/successor?classIds=[...]` | Get successor suggestions for multiple classes |

### NestJS API – Classes as Part of Other Endpoints

| Method | Endpoint | Module | How classes are used |
|--------|----------|--------|---------------------|
| GET | `/groups/class` | GroupApiModule | Combined list of legacy classes + groups of type CLASS |
| GET | `/courses/info` | CourseApiModule | Resolves class names on courses |
| GET | `/schools/:id/students` | SchoolApiModule | Filters students by shared classes |

---

## 9. Key Files Quick Reference

| Purpose | File |
|---------|------|
| **NestJS Class Module** | |
| Module entry point | [class.module.ts](../apps/server/src/modules/class/class.module.ts) |
| Domain object | [class.do.ts](../apps/server/src/modules/class/domain/class.do.ts) |
| Source options DO | [class-source-options.do.ts](../apps/server/src/modules/class/domain/class-source-options.do.ts) |
| Production factory | [class.factory.ts](../apps/server/src/modules/class/domain/class.factory.ts) |
| Entity | [class.entity.ts](../apps/server/src/modules/class/entity/class.entity.ts) |
| Source options entity | [class-source-options.entity.ts](../apps/server/src/modules/class/entity/class-source-options.entity.ts) |
| Repository | [classes.repo.ts](../apps/server/src/modules/class/repo/classes.repo.ts) |
| Query scope | [class.scope.ts](../apps/server/src/modules/class/repo/class.scope.ts) |
| Entity ↔ DO mapper | [class.mapper.ts](../apps/server/src/modules/class/repo/mapper/class.mapper.ts) |
| Service | [class.service.ts](../apps/server/src/modules/class/service/class.service.ts) |
| User deletion saga | [delete-user-class-data.step.ts](../apps/server/src/modules/class/saga/delete-user-class-data.step.ts) |
| School-change handler | [user-changed-school-handler.service.ts](../apps/server/src/modules/class/service/user-changed-school-handler.service.ts) |
| Test factory (DO) | [class.factory.ts](../apps/server/src/modules/class/domain/testing/factory/class.factory.ts) |
| **MoinSchule Adapter** | |
| MoinSchule class service | [moin-schule-class.service.ts](../apps/server/src/modules/class-moin-schule/moin-schule-class.service.ts) |
| MoinSchule class module | [moin-schule-class.module.ts](../apps/server/src/modules/class-moin-schule/moin-schule-class.module.ts) |
| **Group Module (Class List)** | |
| ClassGroupUc | [class-group.uc.ts](../apps/server/src/modules/group/uc/class-group.uc.ts) |
| ClassInfoDto | [class-info.dto.ts](../apps/server/src/modules/group/uc/dto/class-info.dto.ts) |
| InternalClassDto | [internal-class.dto.ts](../apps/server/src/modules/group/uc/dto/internal-class.dto.ts) |
| ClassRootType | [class-root-type.ts](../apps/server/src/modules/group/uc/dto/class-root-type.ts) |
| GroupController (class endpoint) | [group.controller.ts](../apps/server/src/modules/group/controller/group.controller.ts) |
| ClassInfoResponse | [class-info.response.ts](../apps/server/src/modules/group/controller/dto/response/class-info.response.ts) |
| **Legacy Feathers** | |
| Service registration | [src/services/user-group/index.js](../src/services/user-group/index.js) |
| Mongoose model (shared) | [src/services/user-group/model.js](../src/services/user-group/model.js) |
| Classes service | [src/services/user-group/services/classes.js](../src/services/user-group/services/classes.js) |
| ClassModel service (internal) | [src/services/user-group/services/classModelService.js](../src/services/user-group/services/classModelService.js) |
| Class successor service | [src/services/user-group/services/classSuccessor.js](../src/services/user-group/services/classSuccessor.js) |
| Class hooks | [src/services/user-group/hooks/classes.js](../src/services/user-group/hooks/classes.js) |
| Successor hooks | [src/services/user-group/hooks/classSuccessor.js](../src/services/user-group/hooks/classSuccessor.js) |
| Class name parser | [src/services/user-group/logic/classes.js](../src/services/user-group/logic/classes.js) |

---

## 10. Known Complexities & Gotchas

| Issue | Details |
|-------|---------|
| **Dual concept: Class vs. Group** | Legacy `Class` and `Group` (type CLASS) coexist. The frontend sees a merged list. The two have different data structures and lifecycle management. |
| **No NestJS API controller** | All CRUD goes through Feathers. NestJS only provides domain services consumed by other modules. |
| **Shared Mongoose model file** | Classes, courses, and courseGroups share `model.js` and the `getUserGroupSchema` base. Changes affect all three. |
| **displayName is computed differently** | Feathers uses a Mongoose virtual; NestJS uses `getClassFullName()` or inline concatenation in `ClassGroupUc`. |
| **sourceOptions typing** | In Feathers, `sourceOptions` is an untyped `Object`. In NestJS, it's a typed embedded entity (`ClassSourceOptionsEntity` with `tspUid`). |
| **Successor only in Feathers** | The year-transition and successor logic exist only in the Feathers codebase. NestJS has no successor functionality. |
| **No authorization rule for Class** | Unlike Course or Lesson, there is no `ClassRule` in NestJS. Authorization is handled by each consumer (school permission, group permission, etc.). |
| **removeUserReference uses native update** | The repo uses `em.nativeUpdate` with `$pull`, bypassing the ORM's change tracking. This is intentional for performance. |
| **isUpgradable logic** | Determined in `ClassGroupUc`: a class is upgradable if `gradeLevel !== 13` AND it has no `successor` yet. This logic is not on the domain object. |
| **gradeLevel validation** | Entity validates 1–13 in the constructor. Mongoose schema validates min 1, max 13. These must stay in sync. |

---

## 11. Suggested Exploration Order

For hands-on exploration after this presentation:

1. **Start with the domain object:** Read `class.do.ts` – understand `ClassProps`, the mutation methods (`addUser`, `addTeacher`, `clearParticipants`), and `getClassFullName()`
2. **Understand persistence:** Read `class.entity.ts` → `class.mapper.ts` → `classes.repo.ts` to see the Entity ↔ DO mapping and query patterns
3. **Follow a Feathers flow:** Trace a `POST /classes` through `classes.js` → hooks (especially `restrictToCurrentSchool`, `saveSuccessor`) → `classModel`
4. **Study the merged class list:** Trace `GET /groups/class` → `GroupController.findClasses()` → `ClassGroupUc.findAllClasses()` – see how legacy `Class` and `Group` objects are combined
5. **Explore year transition:** Read `classSuccessor.js` – understand `constructSuccessor()`, duplicate detection, and how the frontend workflow creates the successor
6. **See provisioning:** Read `TspProvisioningService.provisionClassBatch()` to see how external systems create and update classes
7. **Trace user lifecycle:** Read `DeleteUserClassDataStep` and `UserChangedSchoolHandlerService` to understand cleanup on user deletion and school transfer

---

*Document prepared for technical handover, June 2026*
