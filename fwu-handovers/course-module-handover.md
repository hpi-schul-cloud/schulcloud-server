# Technical Handover: Course Module

## Document Purpose & Structure

This document guides new developers through the Course-related codebase. It's designed to be presented by someone familiar with the code, not read in isolation. The structure follows a logical learning path: concepts → data model → split implementation → key flows → practical guidance.

---

## 1. Overview & Conceptual Foundation

### 1.1 What is a Course?

A **Course** ("Kurs" in German) is the central organizational unit for teaching content. It groups teachers and students together and acts as a container for:
- **Lessons** (structured teaching units)
- **Tasks** (homework/assignments)
- **Boards** (collaborative content areas)
- **External Tools** (LTI-based integrations)

A course has a defined time span (`startDate` → `untilDate`), after which it becomes "archived."

### 1.2 Related Concepts

| Concept | Relationship to Course |
|---------|----------------------|
| **Learnroom** | Synonimous with Course |
| **CourseGroup** | A sub-group of students *within* a course (e.g., for project work) |
| **Class** | A school class whose students can be enrolled in a course |
| **Group** | A newer abstraction (from provisioning systems) that can also supply students to a course |
| **LegacyBoard** | A single-column list of lessons/tasks/boards belonging to a course |
| **Dashboard** | The user's personalized grid view showing their courses |
| **Room** | The *new* replacement concept (not covered here); course is being deprecated in favor of rooms |

### 1.3 Key Architectural Fact: Split Implementation

⚠️ **The course implementation is split across two systems:**

| System | What it handles | Primary CRUD |
|--------|----------------|--------------|
| **Legacy Feathers** (`src/services/user-group/`) | Course CRUD (create/update/patch/delete), enrollment, class management | The frontend uses this for most course mutations |
| **NestJS** (`apps/server/src/modules/course/`) | Domain object, authorization, sync, course-info admin API, creation | Newer features, admin views, sync |
| **NestJS** (`apps/server/src/modules/learnroom/`) | Dashboard, course room board view, course copy, legacy board management | "Reading" courses as rooms |

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Frontend                                                                    │
├────────────────────┬──────────────────────┬────────────────────────────────┤
│ /courses (CRUD)    │ /course-info (admin) │ /course-rooms (board view)     │
│ /courseGroups       │ /courses (Nest)      │ /dashboard                     │
├────────────────────┼──────────────────────┼────────────────────────────────┤
│ Feathers Service   │ CourseApiModule       │ LearnroomApiModule             │
│ (src/services/     │ (apps/server/src/    │ (apps/server/src/              │
│  user-group/)      │  modules/course/)    │  modules/learnroom/)           │
└────────────────────┴──────────────────────┴────────────────────────────────┘
                                │                         │
                    ┌───────────┴─────────────────────────┴─────────┐
                    │     Shared MongoDB collection: `courses`       │
                    └───────────────────────────────────────────────┘
```

---

## 2. Data Model

### 2.1 Course Entity (MikroORM)

📁 [course.entity.ts](../apps/server/src/modules/course/repo/course.entity.ts)

```typescript
@Entity({ tableName: 'courses' })
export class CourseEntity extends BaseEntityWithTimestamps {
    name: string
    description?: string
    school: SchoolEntity              // Reference to school
    students: Collection<User>        // Enrolled students (userIds in MongoDB)
    teachers: Collection<User>        // Course teachers (teacherIds)
    substitutionTeachers: Collection<User>  // Substitute teachers (substitutionIds)
    courseGroups: Collection<CourseGroupEntity>  // Sub-groups
    color: string                     // Display color (default: '#ACACAC')
    startDate?: Date                  // Course start
    untilDate?: Date                  // Course end (archived when past)
    copyingSince?: Date               // Set during copy operation
    shareToken?: string               // For course sharing/invites
    features?: CourseFeatures[]       // e.g., VIDEOCONFERENCE
    classes: Collection<ClassEntity>  // Enrolled school classes
    groups: Collection<GroupEntity>   // Enrolled groups (from provisioning)
    syncedWithGroup?: GroupEntity     // If synced with external group
    excludeFromSync?: CourseSyncAttribute[]  // Attributes excluded from sync
}
```

### 2.2 Course Domain Object (DDD)

📁 [course.do.ts](../apps/server/src/modules/course/domain/course.do.ts)

A cleaner domain object representation used by newer services:

```typescript
export class Course extends DomainObject<CourseProps> {
    name: string
    students: EntityId[]
    teachers: EntityId[]
    substitutionTeachers: EntityId[]
    classes: EntityId[]
    groups: EntityId[]
    syncedWithGroup?: EntityId
    excludeFromSync?: CourseSyncAttribute[]
}
```

**Note:** Two representations exist side-by-side:
- `CourseEntity` – Used by `CourseService`, `CourseRepo`, and the learnroom module
- `Course` (DO) – Used by `CourseDoService`, `CourseMikroOrmRepo`, sync, and course-info

Both map to the same MongoDB collection via `CourseEntityMapper`.

### 2.3 CourseGroup Entity

📁 [coursegroup.entity.ts](../apps/server/src/modules/course/repo/coursegroup.entity.ts)

A sub-group within a course for splitting students into working groups:

```typescript
@Entity({ tableName: 'coursegroups' })
export class CourseGroupEntity extends BaseEntityWithTimestamps {
    name: string
    students: Collection<User>    // Subset of course students
    course: CourseEntity           // Parent course
    school: SchoolEntity           // Derived from course.school
}
```

CourseGroups can own their own lessons and tasks (they implement `TaskParent` and `LessonParent`).

### 2.4 Mongoose Schema (Legacy Feathers)

📁 [model.js](../src/services/user-group/model.js)

The Mongoose schema includes additional fields not in the MikroORM entity:
- `times` – Scheduled time slots (weekday, startTime, duration, room)
- `isCopyFrom` – Reference to original course (for copies)
- `externalSource` – For externally provisioned courses

### 2.5 Course Lifecycle States

```
┌───────────┐       startDate reached       ┌──────────┐      untilDate passed     ┌──────────┐
│  Created  │ ─────────────────────────────► │  Active  │ ────────────────────────► │ Archived │
└───────────┘                                └──────────┘                            └──────────┘
                                                  │
                                                  │ copyingSince set
                                                  ▼
                                             ┌──────────┐
                                             │ Copying  │ (temporary state)
                                             └──────────┘
```

---

## 3. Module Architecture (NestJS)

### 3.1 Module Layering

| Module | Purpose | File |
|--------|---------|------|
| `CourseModule` | Core domain: services, repos, event handlers | [course.module.ts](../apps/server/src/modules/course/course.module.ts) |
| `CourseApiModule` | REST controllers + use cases | [course-api.module.ts](../apps/server/src/modules/course/course-api.module.ts) |
| `LearnroomModule` | Legacy board, course copy, dashboard services | [learnroom.module.ts](../apps/server/src/modules/learnroom/learnroom.module.ts) |
| `LearnroomApiModule` | Course-rooms controller, dashboard controller, copy UCs | [learnroom-api.module.ts](../apps/server/src/modules/learnroom/learnroom-api.module.ts) |

### 3.2 CourseModule – Directory Structure

```
modules/course/
├── api/                        # API layer (controllers, UCs, DTOs, mappers)
│   ├── course.controller.ts        # /courses endpoints
│   ├── course-info.controller.ts   # /course-info admin endpoint
│   ├── course.uc.ts                # Orchestration for course CRUD
│   ├── course-info.uc.ts           # Orchestration for admin course info
│   ├── course-sync.uc.ts           # Orchestration for sync start/stop
│   ├── dto/                        # Request/response DTOs
│   ├── mapper/                     # Response mappers
│   └── test/                       # API integration tests
├── domain/
│   ├── course.do.ts                # Course domain object
│   ├── interface/                  # Repo interface, enums (CourseStatus, CourseSyncAttribute)
│   ├── service/                    # Domain services (see below)
│   ├── error/                      # Custom error classes
│   ├── loggable/                   # Loggable messages
│   └── mapper/                     # Domain-level mappers (RoleNameMapper)
├── repo/
│   ├── course.entity.ts            # MikroORM entity
│   ├── coursegroup.entity.ts        # CourseGroup entity
│   ├── course.repo.ts              # Entity-based repository
│   ├── course-mikro-orm.repo.ts    # Domain-object-based repository
│   ├── course.scope.ts             # Query scope builder
│   ├── coursegroup.repo.ts          # CourseGroup repository
│   └── mapper/                     # Entity ↔ DO mapper
├── saga/                           # User deletion saga steps
└── testing/                        # Test factories
```

### 3.3 LearnroomModule – Directory Structure

```
modules/learnroom/
├── controller/
│   ├── course-rooms.controller.ts  # /course-rooms endpoints (board view, copy, lesson copy)
│   ├── dashboard.controller.ts     # /dashboard endpoints
│   └── dto/                        # Request/response DTOs
├── domain/
│   └── do/
│       └── dashboard.ts            # Dashboard + GridElement domain objects
├── mapper/                         # Response mappers
├── repo/
│   └── mikro-orm/
│       ├── legacy-board.entity.ts        # Board entity (1:1 with course)
│       ├── legacy-board-element.entity.ts # Abstract board element
│       ├── task-board-element.entity.ts   # Task reference
│       ├── lesson-board-element.entity.ts # Lesson reference
│       ├── column-board-board-element.entity.ts # ColumnBoard reference
│       ├── legacy-board.repo.ts          # Board persistence
│       ├── dashboard.entity.ts           # Dashboard entity
│       ├── dashboard.repo.ts             # Dashboard persistence
│       └── column-board-node.repo.ts     # ColumnBoard node queries
├── service/
│   ├── course-rooms.service.ts     # Syncs legacy board with actual content
│   ├── course-copy.service.ts      # Orchestrates full course copy
│   └── legacy-board-copy.service.ts # Copies board elements (tasks, lessons, boards)
├── uc/
│   ├── course-rooms.uc.ts          # Board view orchestration
│   ├── course-copy.uc.ts           # Copy entry point with auth check
│   ├── dashboard.uc.ts             # Dashboard orchestration
│   ├── lesson-copy.uc.ts           # Lesson copy entry point
│   ├── room-board-dto.factory.ts   # Builds board view DTO with permissions
│   └── course-rooms.authorisation.service.ts # Simple permission checks
├── saga/                           # User deletion: dashboard cleanup
└── types/                          # Type definitions (RoomBoardDTO, etc.)
```

### 3.4 Domain Services

| Service | Responsibility |
|---------|---------------|
| `CourseService` | Entity-based CRUD (find, create, save) – used by learnroom |
| `CourseDoService` | Domain-object-based operations (find, save, filter) – used by newer code |
| `CourseSyncService` | Sync course membership with external groups (primarily moin.schule / Lower Saxony) |
| `CourseGroupService` | Find CourseGroups by user |
| `CourseAuthorizableService` | Loads Course DO for authorization framework |
| `CourseGroupAuthorizableService` | Loads CourseGroup for authorization framework |
| `GroupDeletedHandlerService` | Event handler: removes sync reference when a group is deleted |
| `UserChangedSchoolHandlerService` | Event handler: removes user from courses when they change school |

---

## 4. Legacy Feathers Implementation

### 4.1 Service Structure

📁 [src/services/user-group/](../src/services/user-group/)

The Feathers service layer registers these routes:

| Route | Service | Purpose |
|-------|---------|---------|
| `/courses` | `courseService` | Full CRUD for courses (frontend primary) |
| `/courseModel` | `courseModelService` | Raw Mongoose model access (internal only) |
| `/courseGroups` | `courseGroupService` | CRUD for course sub-groups |
| `/courseGroupModel` | `courseGroupModelService` | Raw model access (internal) |
| `/users/:scopeId/courses` | `courseScopelistService` | List courses for a user with filters |
| `/coursesUserPermissions/:scopeId` | `coursePermissionService` | Get user's permissions in a course scope |
| `/courses/:courseId/members` | `courseMembersService` | Course membership management |

### 4.2 Feathers Course Hooks (Key Logic)

📁 [hooks/courses.js](../src/services/user-group/hooks/courses.js)

Important behaviors implemented in hooks:

| Hook | Trigger | What it does |
|------|---------|--------------|
| `splitClassIdsInGroupsAndClasses` | before create/patch | Separates Group IDs from Class IDs in the request |
| `addWholeClassToCourse` | after create/patch | Adds all students of a class/group to the course's `userIds` |
| `deleteWholeClassFromCourse` | before patch | Removes students when a class is removed |
| `removeColumnBoard` | after remove | Calls NestJS service to delete associated board |
| `removeContextExternalTools` | after remove | Calls NestJS service to clean up tools |
| `restrictChangesToSyncedCourse` | before patch | Prevents changes to synced fields |
| `restrictChangesToArchivedCourse` | before update/patch | Only allows date changes on archived courses |
| `courseInviteHook` | before get | Handles share-link-based access |
| `patchPermissionHook` | before patch | Complex permission routing (link vs normal) |

### 4.3 Course Permission Model (Feathers)

📁 [coursePermission.js](../src/services/user-group/services/coursePermission.js)

Determines user role in a course scope:

| Condition | Role Name | Typical Permissions |
|-----------|-----------|-------------------|
| User is in `teacherIds` | `courseTeacher` | COURSE_EDIT, COURSE_DELETE, etc. |
| User is in `substitutionIds` | `courseSubstitutionTeacher` | Similar to teacher |
| User is in `userIds` | `courseStudent` | COURSE_VIEW |
| User is school admin | `courseAdministrator` | Full permissions |
| User is superhero | `courseAdministrator` | Full permissions |

### 4.4 Cross-boundary Calls (Feathers → NestJS)

On course deletion, the Feathers hooks call NestJS services via the bridge pattern:

```javascript
// In hooks/courses.js (after remove)
await context.app.service('nest-column-board-service').deleteByCourseId(courseId);
await context.app.service('nest-context-external-tool-service').deleteContextExternalToolsByCourseId(courseId);
```

These bridge services are registered in [server.app.ts](../apps/server/src/apps/server.app.ts).

---

## 5. Authorization (NestJS)

### 5.1 CourseRule

📁 [course.rule.ts](../apps/server/src/modules/authorization-rules/rules/course.rule.ts)

Handles both `CourseEntity` and `Course` (DO):

**Read Access:**
- User is a member of the course (student, teacher, or substitution teacher) AND has required permissions
- OR user has `COURSE_ADMINISTRATION` permission (school admin)
- OR user has `COURSE_VIEW` + `CAN_EXECUTE_INSTANCE_OPERATIONS` (instance-level)

**Write Access:**
- User is a teacher/substitution teacher in the course AND has required permissions
- OR user has `COURSE_ADMINISTRATION` permission
- OR user has `COURSE_EDIT` + `CAN_EXECUTE_INSTANCE_OPERATIONS`

### 5.2 Learnroom Authorization

📁 [course-rooms.authorisation.service.ts](../apps/server/src/modules/learnroom/uc/course-rooms.authorisation.service.ts)

Simpler, inline checks for the legacy board view:
- `hasCourseWritePermission` – Is user a teacher/substitution teacher?
- `hasCourseReadPermission` – Is user any member (student/teacher/substitution)?
- `hasTaskReadPermission` – Can user see this task (published status matters)?
- `hasLessonReadPermission` – Can user see this lesson (hidden status matters)?

---

## 6. The Legacy Board (Course Room View)

### 6.1 Concept

Each course has exactly one **LegacyBoard** – a single-column, ordered list of references to:
- Tasks
- Lessons
- ColumnBoards (the newer board system)

This is what users see when they open a course. It represents the "table of contents."

### 6.2 Entity Structure

📁 [legacy-board.entity.ts](../apps/server/src/modules/learnroom/repo/mikro-orm/legacy-board.entity.ts)

```typescript
@Entity({ tableName: 'board' })
export class LegacyBoard extends BaseEntityWithTimestamps {
    course: Ref<CourseEntity>              // 1:1 relationship
    references: Collection<LegacyBoardElement>  // Ordered list of elements
    
    syncBoardElementReferences(targets)    // Auto-add/remove based on actual content
    reorderElements(ids)                   // Reorder by ID list
    getByTargetId(id)                      // Find element by target entity ID
}
```

### 6.3 Board Synchronization

📁 [course-rooms.service.ts](../apps/server/src/modules/learnroom/service/course-rooms.service.ts)

The board is **auto-synchronized** every time it's loaded:

```
updateLegacyBoard(board, courseId, userId)
    ├─► Fetch all lessons for this course
    ├─► Fetch all tasks for this course (visible to user)
    ├─► Fetch all column boards referencing this course
    ├─► Combine into boardElementTargets
    ├─► board.syncBoardElementReferences(targets)
    │   ├─► Remove references to deleted entities
    │   └─► Append new entities not yet referenced
    └─► Save board
```

This means the board always reflects the current state – elements cannot exist on the board without an actual task/lesson/board existing.

### 6.4 Board View DTO Factory

📁 [room-board-dto.factory.ts](../apps/server/src/modules/learnroom/uc/room-board-dto.factory.ts)

Builds the response DTO by:
1. Getting all board elements
2. Filtering by user permissions (students don't see unpublished tasks/hidden lessons)
3. Mapping each element to its type-specific metadata (task status, lesson metadata, board metadata)
4. Building the final `RoomBoardDTO`

---

## 7. Dashboard

### 7.1 Concept

The **Dashboard** is a personalized grid (4 columns) where each cell can contain:
- A single course reference
- A group of course references (user-created grouping)

### 7.2 Domain Object

📁 [dashboard.ts](../apps/server/src/modules/learnroom/domain/do/dashboard.ts)

```typescript
class Dashboard {
    columns: number = 4                      // Grid width
    grid: Map<number, IGridElement>         // Position → element
    userId: EntityId                         // Owner
    
    setLearnRooms(rooms)                    // Sync with current courses
    moveElement(from, to)                   // Drag-and-drop
    getElement(position)                    // Get element at grid position
}

class GridElement implements IGridElement {
    references: Learnroom[]                 // Course(s) in this cell
    title?: string                          // Group title (if grouped)
    
    isGroup(): boolean                      // More than one reference = group
    addReferences(refs)                     // Merge into group
    removeReference(ref)                    // Remove from group
}
```

### 7.3 Dashboard Sync with Courses

Every time the dashboard is loaded (`getUsersDashboard`), it:
1. Fetches all **active** courses for the user
2. Calls `dashboard.setLearnRooms(courses)` which:
   - Removes references to courses the user is no longer in
   - Adds new courses to the first available grid position
3. Persists the updated dashboard

### 7.4 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /dashboard` | GET | Get user's dashboard (auto-synced) |
| `PATCH /dashboard/:id/moveElement` | PATCH | Move/group courses on grid |
| `PATCH /dashboard/:id/element?x=&y=` | PATCH | Rename a group |

---

## 8. Course Copy

### 8.1 Overview

Course copy creates a full deep copy including the legacy board and all its contents (lessons, tasks, column boards).

📁 [course-copy.service.ts](../apps/server/src/modules/learnroom/service/course-copy.service.ts)

### 8.2 Copy Flow

```
CourseCopyUC.copyCourse(userId, courseId)
    │
    ├─► Authorization check (COURSE_CREATE permission)
    │
    └─► CourseCopyService.copyCourse()
        │
        ├─► Load original course + legacy board
        ├─► Sync legacy board (updateLegacyBoard)
        ├─► Derive unique copy name
        │
        ├─► Copy course entity (new entity, same color, user as teacher)
        │   └─► Set startDate/untilDate to current school year
        │
        ├─► Copy context external tools (if feature flag enabled)
        │
        ├─► LegacyBoardCopyService.copyBoard()
        │   │
        │   ├─► For each board element (preserving order):
        │   │   ├─► Task? → TaskCopyService.copyTask()
        │   │   ├─► Lesson? → LessonCopyService.copyLesson()
        │   │   └─► ColumnBoard? → ColumnBoardService.copyColumnBoard()
        │   │
        │   ├─► Build new LegacyBoard with copied references
        │   ├─► Update embedded task references in copied lessons
        │   ├─► Swap internal links (old course ID → new course ID)
        │   └─► Save copied board
        │
        ├─► Finish course copy (clear copyingSince)
        │
        └─► Return CopyStatus tree
```

### 8.3 What is NOT Copied

- Students / enrollment (`NOT_DOING`)
- Time groups / schedules (`NOT_DOING`)
- CourseGroups (`NOT_IMPLEMENTED`)
- Course sync state

### 8.4 CopyStatus

The copy returns a hierarchical status tree:

```
Course (SUCCESS/PARTIAL/FAIL)
├── METADATA (SUCCESS)
├── USER_GROUP (NOT_DOING)
├── TIME_GROUP (NOT_DOING)
├── BOARD (status derived from children)
│   ├── LESSON (status)
│   ├── TASK (status)
│   ├── TASK (status)
│   └── COLUMNBOARD (status)
├── EXTERNAL_TOOL (status, if enabled)
└── COURSEGROUP_GROUP (NOT_IMPLEMENTED, if groups existed)
```

### 8.5 Feature Flags

| Flag | Default | Purpose |
|------|---------|---------|
| `FEATURE_COPY_SERVICE_ENABLED` | depends | Gates course copy entirely |
| `FEATURE_CTL_TOOLS_COPY_ENABLED` | depends | Gates copying of context external tools |

---

## 9. Course Sync with Groups (Brief)

📁 [course-sync.service.ts](../apps/server/src/modules/course/domain/service/course-sync.service.ts)

This feature is **primarily used for Lower Saxony** (moin.schule sync). It allows a course's membership to be kept in sync with an external group from a provisioning system.

**Key points:**
- A course can be linked to a group via `syncedWithGroup`
- When the group changes, `CourseSyncService.synchronizeCourseWithGroup()` updates the course's students/teachers
- Certain attributes can be excluded from sync (`excludeFromSync`)
- The Feathers hook `restrictChangesToSyncedCourse` prevents manual edits to synced fields
- When the synced group is deleted, `GroupDeletedHandlerService` removes the sync reference

---

## 10. Event Handling

| Event | Handler | Action |
|-------|---------|--------|
| `GroupDeletedEvent` | `GroupDeletedHandlerService` | Removes sync reference, clears students |
| `UserChangedSchoolEvent` | `UserChangedSchoolHandlerService` | Removes user from all courses at old school |
| User deletion (saga) | `DeleteUserCourseDataStep` | Removes user references from courses |
| User deletion (saga) | `DeleteUserCourseGroupDataStep` | Removes user from course groups |
| User deletion (saga) | `DeleteUserDashboardDataStep` | Cleans up dashboard |

---

## 11. API Endpoints Summary

### NestJS Course API (`/courses`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/courses` | List courses for current user |
| POST | `/courses` | Create a new course |
| POST | `/courses/:id/stop-sync` | Stop group sync |
| POST | `/courses/:id/start-sync` | Start group sync |
| GET | `/courses/:id/user-permissions` | Get user's permissions |
| GET | `/courses/:id/cc-metadata` | Get Common Cartridge metadata |

### NestJS Course Info API (`/course-info`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/course-info` | Admin: list all courses with filters |

### NestJS Learnroom API (`/course-rooms`, `/dashboard`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/course-rooms/:roomId/board` | Get course's legacy board view |
| PATCH | `/course-rooms/:roomId/elements/:elementId/visibility` | Toggle element visibility |
| PATCH | `/course-rooms/:roomId/board/order` | Reorder board elements |
| POST | `/course-rooms/:roomId/copy` | Copy entire course |
| POST | `/course-rooms/lessons/:lessonId/copy` | Copy a lesson |
| GET | `/dashboard` | Get user's dashboard |
| PATCH | `/dashboard/:id/moveElement` | Move element on dashboard |
| PATCH | `/dashboard/:id/element` | Rename dashboard group |

### Feathers API (Legacy)

| Method | Route | Purpose |
|--------|-------|---------|
| CRUD | `/courses` | Primary course management (frontend uses this) |
| CRUD | `/courseGroups` | Sub-group management |
| GET | `/users/:id/courses` | List user's courses with filters |
| GET | `/coursesUserPermissions/:id` | Scope-based permissions |

---

## 12. Key Files Quick Reference

| Purpose | File |
|---------|------|
| **NestJS Course Module** | |
| Module entry point | [course.module.ts](../apps/server/src/modules/course/course.module.ts) |
| API module | [course-api.module.ts](../apps/server/src/modules/course/course-api.module.ts) |
| Domain object | [course.do.ts](../apps/server/src/modules/course/domain/course.do.ts) |
| Course entity | [course.entity.ts](../apps/server/src/modules/course/repo/course.entity.ts) |
| CourseGroup entity | [coursegroup.entity.ts](../apps/server/src/modules/course/repo/coursegroup.entity.ts) |
| Entity-based repo | [course.repo.ts](../apps/server/src/modules/course/repo/course.repo.ts) |
| DO-based repo | [course-mikro-orm.repo.ts](../apps/server/src/modules/course/repo/course-mikro-orm.repo.ts) |
| Query scopes | [course.scope.ts](../apps/server/src/modules/course/repo/course.scope.ts) |
| Entity ↔ DO mapper | [course.entity.mapper.ts](../apps/server/src/modules/course/repo/mapper/course.entity.mapper.ts) |
| CourseService (entity) | [course.service.ts](../apps/server/src/modules/course/domain/service/course.service.ts) |
| CourseDoService (DO) | [course-do.service.ts](../apps/server/src/modules/course/domain/service/course-do.service.ts) |
| CourseSyncService | [course-sync.service.ts](../apps/server/src/modules/course/domain/service/course-sync.service.ts) |
| Authorization rule | [course.rule.ts](../apps/server/src/modules/authorization-rules/rules/course.rule.ts) |
| **NestJS Learnroom Module** | |
| Module entry point | [learnroom.module.ts](../apps/server/src/modules/learnroom/learnroom.module.ts) |
| API module | [learnroom-api.module.ts](../apps/server/src/modules/learnroom/learnroom-api.module.ts) |
| Course rooms controller | [course-rooms.controller.ts](../apps/server/src/modules/learnroom/controller/course-rooms.controller.ts) |
| Dashboard controller | [dashboard.controller.ts](../apps/server/src/modules/learnroom/controller/dashboard.controller.ts) |
| Dashboard domain object | [dashboard.ts](../apps/server/src/modules/learnroom/domain/do/dashboard.ts) |
| Legacy board entity | [legacy-board.entity.ts](../apps/server/src/modules/learnroom/repo/mikro-orm/legacy-board.entity.ts) |
| Course rooms service | [course-rooms.service.ts](../apps/server/src/modules/learnroom/service/course-rooms.service.ts) |
| Course copy service | [course-copy.service.ts](../apps/server/src/modules/learnroom/service/course-copy.service.ts) |
| Board copy service | [legacy-board-copy.service.ts](../apps/server/src/modules/learnroom/service/legacy-board-copy.service.ts) |
| Board view DTO factory | [room-board-dto.factory.ts](../apps/server/src/modules/learnroom/uc/room-board-dto.factory.ts) |
| **Legacy Feathers** | |
| Service registration | [src/services/user-group/index.js](../src/services/user-group/index.js) |
| Course service + hooks | [src/services/user-group/services/courses.js](../src/services/user-group/services/courses.js) |
| Course hooks (logic) | [src/services/user-group/hooks/courses.js](../src/services/user-group/hooks/courses.js) |
| Mongoose model | [src/services/user-group/model.js](../src/services/user-group/model.js) |
| CourseGroup service | [src/services/user-group/services/courseGroups.js](../src/services/user-group/services/courseGroups.js) |
| Course permissions | [src/services/user-group/services/coursePermission.js](../src/services/user-group/services/coursePermission.js) |
| Course scope lists | [src/services/user-group/services/courseScopeLists.js](../src/services/user-group/services/courseScopeLists.js) |

---

## 13. Known Complexities & Gotchas

| Issue | Details |
|-------|---------|
| **Dual representation** | `CourseEntity` and `Course` (DO) coexist; some services use one, some the other |
| **Dual repository** | `CourseRepo` (entity-based) vs `CourseMikroOrmRepo` (DO-based, injected via `COURSE_REPO` token) |
| **Learnroom deprecated** | Module is marked deprecated but still actively used; "room" concept is unrelated to course-rooms |
| **Legacy board auto-sync** | Board is rebuilt on every load – no explicit "add to board" action exists |
| **Class enrollment** | Adding a class to a course denormalizes all student IDs into `userIds` (Feathers hook logic) |
| **CourseGroups unused in copy** | CourseGroups are `NOT_IMPLEMENTED` in copy flow |
| **Feature flags** | Several behaviors gated behind flags (column board, copy, tools copy, common cartridge) |
| **Shared MongoDB** | Both Feathers (Mongoose) and NestJS (MikroORM) read/write the same `courses` collection |

---

## 14. Suggested Exploration Order

For hands-on exploration after this presentation:

1. **Start with the entity:** Read `course.entity.ts` to understand the full data model
2. **Compare with DO:** Read `course.do.ts` and `course.entity.mapper.ts` to see the mapping
3. **Follow a Feathers flow:** Trace a PATCH to `/courses` through hooks (especially `addWholeClassToCourse`)
4. **Follow a NestJS read:** Trace `GET /course-rooms/:id/board` → `CourseRoomsUc` → `CourseRoomsService` → `RoomBoardDTOFactory`
5. **Understand copy:** Read `CourseCopyService.copyCourse()` end-to-end
6. **Study authorization:** Compare Feathers `coursePermission.js` with NestJS `CourseRule`
7. **Explore dashboard:** Read `DashboardUc.getUsersDashboard()` → `Dashboard.setLearnRooms()`

---

*Document prepared for technical handover, June 2026*
