# Technical Handover: Lesson Module

## Document Purpose & Structure

This document guides new developers through the Lesson-related codebase. It's designed to be presented by someone familiar with the code, not read in isolation. The structure follows a logical learning path: concepts → data model → split implementation → key flows → practical guidance.

---

## 1. Overview & Conceptual Foundation

### 1.1 What is a Lesson?

A **Lesson** ("Thema" in German) is a structured teaching unit within a course. It serves as a container for various content components that teachers assemble for instruction. Lessons appear as items on the course's legacy board.

**Key characteristics:**
- A lesson belongs to exactly one **Course** or one **CourseGroup**
- It contains an ordered list of **content components** (text, etherpads, GeoGebra, embedded tasks, Lernstore resources)
- It can be **hidden** (draft) or **visible** (published) to students
- It has a **position** within its parent (ordering on the board)
- It can own **linked tasks** (tasks associated with this lesson)
- It can reference **materials** (from the Lernstore)

### 1.2 Related Concepts

| Concept | Relationship to Lesson |
|---------|----------------------|
| **Course** | Parent container – a lesson always belongs to a course |
| **CourseGroup** | Alternative parent – a lesson can belong to a course sub-group instead |
| **Task** | Can be linked to a lesson (one-to-many) |
| **Material** | Lernstore resources referenced by a lesson |
| **LegacyBoard** | The course's board displays lessons as elements |
| **Component** | A content block within a lesson (text, etherpad, etc.) |

### 1.3 Key Architectural Fact: Split Implementation

⚠️ **Like courses, lessons are split across Feathers and NestJS:**

| System | What it handles |
|--------|----------------|
| **Legacy Feathers** (`src/services/lesson/`) | Full CRUD (create, find, update, patch, remove), content management, sharing |
| **NestJS** (`apps/server/src/modules/lesson/`) | Get, delete, copy, linked tasks query, authorization |

```
┌──────────────────────────────────────────────────────────────┐
│ Frontend                                                      │
├──────────────────────────┬───────────────────────────────────┤
│ /lessons (CRUD)          │ /lessons/:id (GET, DELETE)         │
│ /lessons/contents/:type  │ /lessons/:id/tasks                │
│ /lessons/:id/material    │ /course-rooms/lessons/:id/copy    │
├──────────────────────────┼───────────────────────────────────┤
│ Feathers Service         │ LessonApiModule + LearnroomApi     │
│ (src/services/lesson/)   │ (apps/server/src/modules/lesson/) │
└──────────────────────────┴───────────────────────────────────┘
                    │                       │
        ┌───────────┴───────────────────────┴──────────┐
        │     Shared MongoDB collection: `lessons`      │
        └──────────────────────────────────────────────┘
```

**In summary:**
- The frontend uses Feathers for creating/editing lesson structure and content
- The frontend uses NestJS for reading lessons, deleting, querying linked tasks, and copying

---

## 2. Data Model

### 2.1 Lesson Entity (MikroORM)

📁 [lesson.entity.ts](../apps/server/src/modules/lesson/repo/lesson.entity.ts)

```typescript
@Entity({ tableName: 'lessons' })
export class LessonEntity extends BaseEntityWithTimestamps implements TaskParent {
    name: string                        // Lesson title
    hidden: boolean                     // Draft (true) or published (false)
    course: CourseEntity                // Parent course (required)
    courseGroup?: CourseGroupEntity      // Alternative parent (optional)
    position: number                    // Order within course (0-based)
    contents: ComponentProperties[]     // Array of content components
    materials: Collection<Material>     // Referenced Lernstore materials
    tasks: Collection<Task>             // Linked tasks (one-to-many)
}
```

### 2.2 Content Components

The `contents` field is a JSON array of typed components. Each component has:

```typescript
type ComponentProperties = {
    _id?: string              // Component-level ID
    title: string             // Section title
    hidden: boolean           // Can hide individual components
    user?: ObjectId           // Creator of this component
    component: ComponentType  // Discriminator
    content: ...              // Type-specific content
}
```

**Component Types:**

| Type | Enum Value | Content | Purpose |
|------|-----------|---------|---------|
| **Text** | `'text'` | `{ text: string }` | Rich text (HTML) content |
| **Etherpad** | `'Etherpad'` | `{ description, title, url }` | Collaborative text editing |
| **GeoGebra** | `'geoGebra'` | `{ materialId: string }` | Math visualization tool |
| **Internal** | `'internal'` | `{ url: string }` | Link to internal resource (embedded task) |
| **Lernstore** | `'resources'` | `{ resources: [...] }` | Learning resources from Lernstore |

### 2.3 Material Entity

📁 [materials.entity.ts](../apps/server/src/modules/lesson/repo/materials.entity.ts)

```typescript
@Entity({ collection: 'materials' })
export class Material extends BaseEntityWithTimestamps {
    client: string                              // Source system
    description?: string
    license: string[]
    relatedResources: RelatedResourceProperties[]
    subjects: string[]
    tags: string[]
    targetGroups: TargetGroupProperties[]
    title: string
    url: string
}
```

Materials are shared entities – multiple lessons can reference the same material.

### 2.4 MongoDB Schema (Legacy Feathers)

📁 [model.js](../src/services/lesson/model.js)

The Mongoose schema includes additional fields not in the MikroORM entity:
- `teamId` – Lessons can also belong to teams (deprecated/unused path)
- `shareToken` – For lesson sharing (auto-generated if course is shareable)
- `isCopyFrom` – Reference to original lesson (for copies)
- `date` / `time` – Scheduling fields (appear unused in current hooks)

### 2.5 Lesson Visibility Model

```
┌─────────────────────────────────────────────────────────┐
│ Lesson: hidden = true (Draft)                           │
│                                                         │
│  Visible to: Teachers, Substitution Teachers            │
│  Hidden from: Students                                  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Component: hidden = true                         │    │
│  │  → Hidden even from teachers in normal view      │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Lesson: hidden = false (Published)                      │
│                                                         │
│  Visible to: All course members                         │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Module Architecture (NestJS)

### 3.1 Module Layering

| Module | Purpose | File |
|--------|---------|------|
| `LessonModule` | Core domain: service, repo, copy, etherpad integration | [lesson.module.ts](../apps/server/src/modules/lesson/lesson.module.ts) |
| `LessonApiModule` | REST controller + UC for get/delete/tasks | [lesson-api.module.ts](../apps/server/src/modules/lesson/lesson-api.module.ts) |

**Note:** Lesson copy is triggered from the `LearnroomApiModule` (via `LessonCopyUC`), not from `LessonApiModule`.

### 3.2 Directory Structure

```
modules/lesson/
├── api/
│   ├── lesson.controller.ts       # /lessons endpoints (GET, DELETE, GET tasks)
│   ├── uc/
│   │   └── lesson.uc.ts           # Orchestration (auth + service calls)
│   ├── dto/
│   │   ├── lesson.response.ts          # Full lesson response
│   │   ├── lesson-content.response.ts  # Component content response
│   │   ├── lesson-linked-task.response.ts  # Task list response
│   │   ├── material.response.ts        # Material response
│   │   ├── lernstore.resources.ts      # Lernstore resource shape
│   │   └── lesson.url.params.ts        # URL parameter validation
│   ├── mapper/
│   │   └── lesson.mapper.ts       # Task → response mapper
│   └── api-test/                   # Integration tests
├── domain/
│   ├── service/
│   │   ├── lesson.service.ts      # Core domain service (find, delete)
│   │   ├── lesson-copy.service.ts # Complex copy logic
│   │   └── etherpad.service.ts    # Etherpad pad creation (via Feathers bridge)
│   └── types/
│       ├── lesson-copy.params.ts       # Copy input parameters
│       └── lesson-copy-parent.params.ts # Copy parent (destination course)
├── repo/
│   ├── lesson.entity.ts           # MikroORM entity
│   ├── lesson.repo.ts             # Repository
│   ├── lesson-scope.ts            # Query scope builder
│   ├── materials.entity.ts        # Material entity
│   └── materials.repo.ts          # Material repository
├── saga/
│   └── delete-user-lesson-data.step.ts  # User deletion cleanup
└── testing/
    ├── lesson.factory.ts          # Test factory
    └── material.factory.ts        # Test factory
```

### 3.3 Domain Services

| Service | Responsibility |
|---------|---------------|
| `LessonService` | Find by ID, find by course IDs, find by user, delete (incl. file cleanup) |
| `LessonCopyService` | Deep copy of lesson including all components, tasks, materials, files |
| `EtherpadService` | Creates new Etherpad pads via Feathers bridge (`/etherpad/pads`) |

---

## 4. Legacy Feathers Implementation

### 4.1 Service Structure

📁 [src/services/lesson/](../src/services/lesson/)

| Route | Service | Purpose |
|-------|---------|---------|
| `/lessons` | Mongoose model service | Full CRUD for lessons |
| `/lessons/contents/:type/` | `lessonContentService` | Query all content components of a type across user's courses |
| `/lessons/:lessonId/material` | `AddMaterialService` | Add a Lernstore material to a lesson |

### 4.2 Feathers Hooks (Key Logic)

📁 [hooks/index.js](../src/services/lesson/hooks/index.js)

| Hook | Trigger | What it does |
|------|---------|--------------|
| `mapUsers` | before all | Sets `user` field on content components to current user |
| `validateLessonFind` | before find | Requires `courseId`, `courseGroupId`, or `shareToken` in query |
| `restrictToUsersCoursesLessons` | before find/get/update/patch/remove | Ensures user is in the course or coursegroup |
| `checkIfCourseGroupLesson` | before create/update/patch/remove | Switches permission check between `COURSEGROUP_*` and `TOPIC_*` |
| `setPosition` | before create | Auto-assigns position (count of existing lessons) |
| `addShareTokenIfCourseShareable` | after create | Generates a share token if the course has one |
| `checkCorrectCourseOrTeamId` | before create/update | Validates the courseId reference |

### 4.3 Permission Model (Feathers)

Permissions depend on whether the lesson is in a course or coursegroup:

| Context | Create/Delete Permission | Edit Permission | View Permission |
|---------|-------------------------|-----------------|-----------------|
| Course lesson | `TOPIC_CREATE` | `TOPIC_EDIT` | `TOPIC_VIEW` |
| CourseGroup lesson | `COURSEGROUP_CREATE` | `COURSEGROUP_EDIT` | `TOPIC_VIEW` |

Access is additionally restricted to users who are members of the course (or coursegroup for coursegroup lessons).

### 4.4 LessonContent Service

📁 [lessonContentService.js](../src/services/lesson/services/lessonContentService.js)

A specialized aggregation query that:
1. Joins lessons with courses
2. Filters to courses the user is a member of
3. Unwinds the `contents` array
4. Filters by component type (e.g., `'Etherpad'`)
5. Returns only components that are not hidden or belong to the requesting user

This powers features like "show all my Etherpads across all courses."

### 4.5 AddMaterial Service

📁 [AddMaterialService.js](../src/services/lesson/services/AddMaterialService.js)

Creates a new Material document and adds its ID to the lesson's `materialIds` array. Used when a teacher adds a Lernstore resource to a lesson.

---

## 5. Authorization (NestJS)

### 5.1 LessonRule

📁 [lesson.rule.ts](../apps/server/src/modules/authorization-rules/rules/lesson.rule.ts)

The lesson authorization **delegates to the parent's rule**:

```
LessonRule.hasPermission(user, lesson, context)
    │
    ├─► Has CourseGroup? → CourseGroupRule.hasPermission(...)
    └─► Has Course? → CourseRule.hasPermission(...)
```

**Read Access Logic:**
- If lesson is **published** (`hidden = false`): User needs **read** access to the parent (course/coursegroup)
- If lesson is **hidden** (`hidden = true`): User needs **write** access to the parent (i.e., must be teacher)

**Write Access Logic:**
- User needs **write** access to the parent (teacher/substitution teacher in course)

### 5.2 Permission Used in UC

The `LessonUC` uses `Permission.TOPIC_VIEW` for both read and write contexts:
```typescript
// Delete: write context with TOPIC_VIEW permission
AuthorizationContextBuilder.write([Permission.TOPIC_VIEW])

// Get: read context with TOPIC_VIEW permission
AuthorizationContextBuilder.read([Permission.TOPIC_VIEW])
```

This is because students don't have `TOPIC_EDIT`, and the rule uses the parent delegation to determine actual access.

---

## 6. Lesson Copy

### 6.1 Overview

Lesson copy is a complex operation that handles all content types differently. It's triggered from two places:
- **Course copy** – `LegacyBoardCopyService` copies all lessons as part of a full course copy
- **Standalone lesson copy** – `LessonCopyUC` (in learnroom) handles individual lesson copies

### 6.2 Copy Entry Point

📁 [lesson-copy.uc.ts](../apps/server/src/modules/learnroom/uc/lesson-copy.uc.ts)

```
LessonCopyUC.copyLesson(userId, lessonId, parentParams)
    │
    ├─► Load user + original lesson
    ├─► Check read permission on original lesson (TOPIC_CREATE)
    ├─► Determine destination course (explicit or same as original)
    ├─► Check write permission on destination course
    ├─► Derive unique copy name
    │
    └─► LessonCopyService.copyLesson(params)
```

### 6.3 Copy Service Detail

📁 [lesson-copy.service.ts](../apps/server/src/modules/lesson/domain/service/lesson-copy.service.ts)

```
LessonCopyService.copyLesson(params)
    │
    ├─► Load original lesson
    │
    ├─► Copy content components (per-type handling):
    │   ├─► Text → deep copy HTML content
    │   ├─► Lernstore → copy resource references
    │   ├─► GeoGebra → copy with empty materialId (PARTIAL status)
    │   ├─► Etherpad → create NEW pad via EtherpadService (PARTIAL status)
    │   └─► Internal (embedded task link) → copy URL (task ID swapped later)
    │
    ├─► Copy linked materials (create new Material entities)
    │
    ├─► Create new LessonEntity (hidden = true, same position)
    │
    ├─► Copy linked tasks (via TaskCopyService)
    │
    ├─► Copy files (via CopyFilesService, RabbitMQ-based)
    │   └─► Replace file URLs in text content
    │
    ├─► Update embedded task IDs (swap old → new IDs in internal component URLs)
    │
    └─► Return CopyStatus tree
```

### 6.4 Component Copy Behavior

| Component | Copy Strategy | Status |
|-----------|--------------|--------|
| **Text** | Full copy of HTML content | SUCCESS |
| **Lernstore** | Copy resource references | SUCCESS |
| **GeoGebra** | Copy structure, clear `materialId` (must be re-configured) | PARTIAL |
| **Etherpad** | Create brand new empty pad | PARTIAL |
| **Internal** | Copy URL, later swap task ID with copied task ID | SUCCESS |

### 6.5 CopyStatus Tree

```
Lesson (SUCCESS/PARTIAL/FAIL)
├── METADATA (SUCCESS)
├── LESSON_CONTENT_GROUP (derived from children)
│   ├── LESSON_CONTENT_TEXT (SUCCESS)
│   ├── LESSON_CONTENT_ETHERPAD (PARTIAL)
│   └── LESSON_CONTENT_GEOGEBRA (PARTIAL)
├── LERNSTORE_MATERIAL_GROUP (derived)
│   └── LERNSTORE_MATERIAL (SUCCESS per item)
├── TASK_GROUP (derived)
│   ├── TASK (status)
│   └── TASK (status)
└── FILE_GROUP (derived from file copy)
```

### 6.6 Feature Flags

| Flag | Purpose |
|------|---------|
| `FEATURE_COPY_SERVICE_ENABLED` | Gates lesson copy (checked in `LessonCopyUC`) |
| `FEATURE_ETHERPAD_ENABLED` | If disabled, Etherpad components are skipped during copy |

---

## 7. Etherpad Integration

### 7.1 Architecture

Etherpads are created via a **Feathers bridge** from NestJS:

```
NestJS (LessonCopyService)
    │
    └─► EtherpadService.createEtherpad(userId, courseId, title)
        │
        └─► FeathersServiceProvider.getService('/etherpad/pads').create(...)
            │
            └─► Feathers Etherpad Service (src/services/etherpad/)
                │
                └─► Etherpad HTTP API
```

### 7.2 Pad Naming

Each pad gets a random hex title (`randomBytes(12).toString('hex')`) to avoid conflicts. The URL is composed as `{padUri}/{padId}`.

### 7.3 Configuration

📁 [lesson.config.ts](../apps/server/src/modules/lesson/lesson.config.ts)

```typescript
ETHERPAD__PAD_URI  // Base URL for pad links
FEATURE_ETHERPAD_ENABLED  // Enable/disable etherpad support
```

---

## 8. Event Handling & User Deletion

### 8.1 Saga Step

📁 [delete-user-lesson-data.step.ts](../apps/server/src/modules/lesson/saga/delete-user-lesson-data.step.ts)

When a user is deleted:
1. Find all lessons where the user is referenced in `contents[].user`
2. Remove the user reference (set to undefined) via `$unset`

**Note:** This does NOT delete lessons – it only removes the user attribution from content components they created.

### 8.2 Lesson Deletion

When a lesson is deleted via `LessonService.deleteLesson()`:
1. Delete all associated files via `FilesStorageClientAdapterService` (RabbitMQ)
2. Delete the lesson entity (cascade removes linked tasks via `orphanRemoval: true`)

---

## 9. Repository & Querying

### 9.1 LessonRepo

📁 [lesson.repo.ts](../apps/server/src/modules/lesson/repo/lesson.repo.ts)

| Method | Purpose |
|--------|---------|
| `findById(id)` | Load lesson with populated course, tasks, materials, courseGroup |
| `findAllByCourseIds(ids, filters?)` | Find lessons for courses, optionally filter by hidden state |
| `findByUserId(userId)` | Aggregation: find lessons where user appears in `contents[].user` |
| `removeUserReference(userId)` | Remove user from content components (for deletion) |
| `createLesson(lesson)` | Create new lesson entity |
| `save(lesson)` | Persist changes |
| `delete(lesson)` | Remove lesson |

### 9.2 LessonScope

📁 [lesson-scope.ts](../apps/server/src/modules/lesson/repo/lesson-scope.ts)

```typescript
class LessonScope extends Scope<LessonEntity> {
    byCourseIds(courseIds: EntityId[])   // Filter by course membership
    byHidden(isHidden: boolean)          // Filter by visibility
}
```

### 9.3 Important: Population

The `findById` method eagerly populates:
- `course` – needed for authorization (course membership check)
- `tasks` – needed for task counting and linked task queries
- `materials` – needed for material listing
- `courseGroup.course` – needed for courseGroup authorization chain

---

## 10. API Endpoints Summary

### NestJS Lesson API (`/lessons`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/lessons/:lessonId` | Get full lesson with content, materials |
| DELETE | `/lessons/:lessonId` | Delete lesson (incl. files and tasks) |
| GET | `/lessons/:lessonId/tasks` | Get linked tasks for a lesson |

### NestJS Learnroom API (copy)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/course-rooms/lessons/:lessonId/copy` | Copy a lesson |

### Feathers API (Legacy)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/lessons?courseId=` | Find all lessons for a course |
| GET | `/lessons/:id` | Get a single lesson (deprecated – use NestJS) |
| POST | `/lessons` | Create a new lesson |
| PUT | `/lessons/:id` | Update a lesson |
| PATCH | `/lessons/:id` | Patch lesson fields |
| DELETE | `/lessons/:id` | Remove a lesson (deprecated – use NestJS) |
| GET | `/lessons/contents/:type/` | Query all components of a type across user's courses |
| POST | `/lessons/:lessonId/material` | Add material to a lesson |

---

## 11. How Lessons Appear on the Course Board

Lessons are surfaced through the **LearnroomModule's** course-rooms flow:

```
GET /course-rooms/:courseId/board
    │
    └─► CourseRoomsService.updateLegacyBoard()
        │
        ├─► LessonService.findByCourseIds([courseId])  ◄── fetches all lessons
        ├─► TaskService.findBySingleParent(...)
        ├─► ColumnBoardNodeRepo.findByExternalReference(...)
        │
        └─► board.syncBoardElementReferences([...lessons, ...tasks, ...boards])
            │
            └─► Each lesson becomes a LessonBoardElement on the board
```

In the board view DTO, each lesson is mapped to:
```typescript
type LessonMetaData = {
    id: EntityId
    name: string
    hidden: boolean
    createdAt: Date
    updatedAt: Date
    numberOfPublishedTasks: number
    numberOfDraftTasks?: number       // Only for teachers
    numberOfPlannedTasks?: number     // Only for teachers
    courseName: string
}
```

---

## 12. Key Files Quick Reference

| Purpose | File |
|---------|------|
| **NestJS Lesson Module** | |
| Module entry point | [lesson.module.ts](../apps/server/src/modules/lesson/lesson.module.ts) |
| API module | [lesson-api.module.ts](../apps/server/src/modules/lesson/lesson-api.module.ts) |
| Controller | [lesson.controller.ts](../apps/server/src/modules/lesson/api/lesson.controller.ts) |
| Use case | [lesson.uc.ts](../apps/server/src/modules/lesson/api/uc/lesson.uc.ts) |
| Lesson entity | [lesson.entity.ts](../apps/server/src/modules/lesson/repo/lesson.entity.ts) |
| Material entity | [materials.entity.ts](../apps/server/src/modules/lesson/repo/materials.entity.ts) |
| Repository | [lesson.repo.ts](../apps/server/src/modules/lesson/repo/lesson.repo.ts) |
| Query scope | [lesson-scope.ts](../apps/server/src/modules/lesson/repo/lesson-scope.ts) |
| Lesson service | [lesson.service.ts](../apps/server/src/modules/lesson/domain/service/lesson.service.ts) |
| Copy service | [lesson-copy.service.ts](../apps/server/src/modules/lesson/domain/service/lesson-copy.service.ts) |
| Etherpad service | [etherpad.service.ts](../apps/server/src/modules/lesson/domain/service/etherpad.service.ts) |
| Configuration | [lesson.config.ts](../apps/server/src/modules/lesson/lesson.config.ts) |
| Authorization rule | [lesson.rule.ts](../apps/server/src/modules/authorization-rules/rules/lesson.rule.ts) |
| **Learnroom (Copy UC)** | |
| Lesson copy UC | [lesson-copy.uc.ts](../apps/server/src/modules/learnroom/uc/lesson-copy.uc.ts) |
| **Legacy Feathers** | |
| Service registration | [src/services/lesson/index.js](../src/services/lesson/index.js) |
| Hooks | [src/services/lesson/hooks/index.js](../src/services/lesson/hooks/index.js) |
| Mongoose model | [src/services/lesson/model.js](../src/services/lesson/model.js) |
| Content service | [src/services/lesson/services/lessonContentService.js](../src/services/lesson/services/lessonContentService.js) |
| Add material service | [src/services/lesson/services/AddMaterialService.js](../src/services/lesson/services/AddMaterialService.js) |
| CourseGroup check hook | [src/services/lesson/hooks/checkIfCourseGroupLesson.js](../src/services/lesson/hooks/checkIfCourseGroupLesson.js) |
| **Etherpad (Feathers)** | |
| Etherpad service | [src/services/etherpad/](../src/services/etherpad/) |

---

## 13. Known Complexities & Gotchas

| Issue | Details |
|-------|---------|
| **No domain object** | Unlike Course, Lesson has no separate DO – only the entity is used everywhere |
| **Contents as JSON blob** | The `contents` array is a loosely-typed JSON structure, not separate entities |
| **Component IDs** | Components have `_id` fields (MongoDB-generated), but they're subdocuments, not separate collections |
| **CourseGroup complexity** | Authorization changes when a lesson belongs to a CourseGroup instead of a Course |
| **Etherpad via Feathers** | Even in NestJS, new etherpads are created through the Feathers bridge |
| **No create/update in NestJS** | Only read and delete are in NestJS; the frontend still uses Feathers for mutations |
| **Task cascade** | Deleting a lesson cascades to its tasks (orphanRemoval) – this is entity-level, not explicit |
| **File deletion via RabbitMQ** | File cleanup on lesson deletion is asynchronous (eventual consistency) |
| **shareToken** | Managed entirely in Feathers; auto-generated if course has one |
| **Position management** | Position is set on create (count of existing lessons) but can drift if lessons are deleted |

---

## 14. Suggested Exploration Order

For hands-on exploration after this presentation:

1. **Start with the entity:** Read `lesson.entity.ts` – understand `contents`, the component type system, and relationships
2. **Understand content types:** Look at `ComponentProperties` and its discriminated union
3. **Follow a Feathers flow:** Trace a POST to `/lessons` through hooks (especially `setPosition`, `mapUsers`, `restrictToUsersCoursesLessons`)
4. **Follow a NestJS read:** Trace `GET /lessons/:id` → `LessonUC.getLesson()` → `LessonService` → `LessonRepo`
5. **Study authorization:** Read `LessonRule` and understand the parent-delegation pattern
6. **Explore copy:** Read `LessonCopyService.copyLesson()` – follow each component type's copy function
7. **See board integration:** Read how `CourseRoomsService.updateLegacyBoard()` includes lessons

---

*Document prepared for technical handover, June 2026*
