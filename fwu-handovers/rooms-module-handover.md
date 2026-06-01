# Technical Handover: Rooms Module

## Document Purpose & Structure

This document guides new developers through the Rooms module codebase. It's designed to be presented by someone familiar with the code, not read in isolation. The structure follows a logical learning path: concepts → module structure → domain model → membership & groups → authorization → invitation links → practical guidance.

A general introduction to the project architecture (clean architecture layers, NestJS modules, use cases, repositories) is assumed. The [architecture documentation](https://documentation.dbildungscloud.dev/docs/backend-design-patterns/architecture) and the board module handover are good prior reading.

---

## 1. Overview & Conceptual Foundation

### 1.1 What is a Room?

Rooms ("Bereiche" in German) are **digital collaborative spaces** for teachers and students. Each room has:
- A set of **members** with individual **roles** (Owner, Admin, Editor, Viewer, Applicant)
- **Boards** as content (ColumnBoards from the board module)
- **Configuration** (color, date range, feature flags)

📖 [Overview documentation](https://documentation.dbildungscloud.dev/docs/topics/rooms/overview)

### 1.2 Roles

Room roles follow a **linear hierarchy** — a higher role can do everything a lower role can do:

| Role | Key Capabilities |
|------|-----------------|
| `ROOMOWNER` | Full control. One per room. Must be a teacher. Cannot leave without transferring ownership. |
| `ROOMADMIN` | Manage members and room settings. Can invite users from other schools (see §1.3). |
| `ROOMEDITOR` | Create and edit all content. The typical teacher role. |
| `ROOMVIEWER` | Read-only access. The typical student role. |
| `ROOMAPPLICANT` | Joined via an invitation link that requires confirmation. Not yet a full member. |

Roles are **independent of school roles** (teacher/student), but there are business restrictions: students can never be room owner, for example.

### 1.3 Cross-School Operation

Each room belongs to exactly one school, but users from other schools can be members. When a user from another school joins a room, they are also added as a **guest** to the room's school.

The key constraint: **only a Room Admin can add users from another school**, and only publicly visible teachers from other schools can be added directly (not students). A teacher from the other school with the Admin role can then invite their own students.

### 1.4 Locked Rooms

A room with **no owner** is considered **locked**. Most operations are blocked on a locked room. Only a school administrator with `SCHOOL_ADMINISTRATE_ROOMS` permission can act on a locked room (e.g., to assign a new owner).

This is a recurring concept you will encounter throughout the authorization code.

---

## 2. Module Architecture

### 2.1 The Five Modules

Five NestJS modules work together to implement rooms:

| Module | Responsibility | File |
|--------|---------------|------|
| `RoomModule` | Core domain: `Room` object, its services, repos | [room.module.ts](../apps/server/src/modules/room/room.module.ts) |
| `RoomApiModule` | REST API: controllers, use cases, sagas | [room-api.module.ts](../apps/server/src/modules/room/room-api.module.ts) |
| `RoomMembershipModule` | Bridge between rooms and groups. Authorization rules. | [room-membership.module.ts](../apps/server/src/modules/room-membership/room-membership.module.ts) |
| `GroupModule` | Generic user-group storage with roles. Used by membership. | [group.module.ts](../apps/server/src/modules/group/group.module.ts) |
| `BoardModule` | Room content (boards). Separate module, not covered here. | [board.module.ts](../apps/server/src/modules/board/board.module.ts) |

```
┌──────────────────────────────────────────────────────────┐
│                      RoomApiModule                        │
│  (Controllers, Use Cases, Sagas, Board/Permission Utils) │
├─────────────────────┬────────────────────────────────────┤
│     RoomModule      │      RoomMembershipModule           │
│  (Room domain,      │  (RoomMembership domain,            │
│   services, repos)  │   authorization rules,              │
│                     │   builds authorizables)             │
│                     ├──────────────────────────────────── │
│                     │         GroupModule                  │
│                     │  (generic group + role storage)      │
└─────────────────────┴──────────────────────────────────── ┘
```

### 2.2 Directory Structure

```
room/
├── api/                    # Use cases, controllers, DTOs, mappers
│   ├── dto/                # Request/response DTOs
│   ├── loggables/          # Typed loggable exceptions
│   ├── mapper/             # API ↔ domain mappers
│   ├── saga/               # CQRS saga steps (copy room, delete user data)
│   ├── service/            # API-layer helpers (RoomPermissionService, RoomBoardService)
│   ├── test/               # API integration tests
│   └── type/               # API-layer-specific types
├── domain/
│   ├── do/                 # Domain objects: Room, RoomInvitationLink
│   ├── events/             # Domain events (RoomDeletedEvent)
│   ├── factory/            # Object factories
│   ├── service/            # Domain services
│   └── type/               # Enums (RoomColor, RoomFeatures)
├── repo/                   # Repository + entities + mappers
│   └── entity/
├── room.module.ts
├── room-api.module.ts
└── room.config.ts

room-membership/
├── authorization/          # RoomRule, RoomMemberRule, RoomInvitationLinkRule
├── do/                     # RoomMembership, RoomMember, and all Authorizable DOs
├── repo/                   # RoomMembershipRepo
├── service/                # RoomMembershipService
├── testing/
└── type/
```

---

## 3. Domain Model

### 3.1 Room

📁 [room.do.ts](../apps/server/src/modules/room/domain/do/room.do.ts)

The `Room` domain object is intentionally simple. It holds the room's configuration — it has no knowledge of who its members are.

```typescript
export interface RoomProps extends AuthorizableObject {
    id: EntityId;
    name: string;
    color: RoomColor;
    startDate?: Date;
    endDate?: Date;
    schoolId: EntityId;
    features: RoomFeatures[];  // e.g. EDITOR_MANAGE_VIDEOCONFERENCE
    createdAt: Date;
    updatedAt: Date;
}
```

Member data lives entirely in `RoomMembershipModule`, not here.

### 3.2 RoomMembership

📁 [room-membership.do.ts](../apps/server/src/modules/room-membership/do/room-membership.do.ts)

`RoomMembership` is the bridge domain object. It stores the link between a room and the group that holds its users:

```typescript
export interface RoomMembershipProps {
    id: EntityId;
    roomId: EntityId;       // → Room
    userGroupId: EntityId;  // → Group (in GroupModule)
    schoolId: EntityId;
}
```

Each room has exactly **one** `RoomMembership` record, pointing to exactly **one** `Group`.

### 3.3 The Group Module (Brief Introduction)

📁 [group.ts](../apps/server/src/modules/group/domain/group.ts)

The `Group` module provides a **generic abstraction for storing a set of users with context-specific roles**. It is not rooms-specific — it is also used for school classes, courses, etc.

```typescript
export interface GroupProps {
    id: EntityId;
    name: string;
    type: GroupTypes;       // e.g. GroupTypes.ROOM
    users: GroupUser[];
    organizationId?: string;
}

// Each user-role pair in the group:
export interface GroupUser {
    userId: EntityId;
    roleId: EntityId;       // Points to a Role entity with permissions
}
```

`GroupService` provides `findById`, `addUsersToGroup`, `removeUsersFromGroup`, `delete`, etc. The room module treats the Group module as an **internal storage detail** — `RoomMembershipService` is the only consumer relevant to rooms and wraps all group interactions.

### 3.4 How It All Fits Together

```
Room ──────────────────────────────────── RoomMembership
(name, color, schoolId, features)         (roomId, userGroupId)
                                                    │
                                                    ▼
                                               Group (type=ROOM)
                                               ├── GroupUser { userId, roleId → ROOMOWNER }
                                               ├── GroupUser { userId, roleId → ROOMEDITOR }
                                               └── GroupUser { userId, roleId → ROOMVIEWER }
```

When you need to know who is in a room and at what role, `RoomMembershipService.getRoomMembers(roomId)` orchestrates loading the `RoomMembership`, fetching the `Group`, resolving users and their roles.

---

## 4. RoomMembershipService

📁 [room-membership.service.ts](../apps/server/src/modules/room-membership/service/room-membership.service.ts)

`RoomMembershipService` is the **public interface of the membership module** for all other modules. Its most important responsibility, beyond membership CRUD, is building the **authorizables** used for authorization checks.

Key methods:

```typescript
// CRUD
createNewRoomMembership(roomId, ownerUserId): Promise<RoomMembership>
deleteRoomMembership(roomId): Promise<void>
addMembersToRoom(roomId, members): Promise<void>
changeRoleOfMember(roomId, userId, newRoleName): Promise<void>
removeMembersFromRoom(roomId, userIds): Promise<void>
getRoomMembers(roomId): Promise<RoomMember[]>

// Authorization support – used by use cases before every auth check
getRoomAuthorizable(roomId): Promise<RoomAuthorizable>
getRoomAuthorizablesByUserId(userId): Promise<RoomAuthorizable[]>
getRoomInvitationLinkAuthorizable(link): Promise<RoomInvitationLinkAuthorizable>
```

**On room deletion**, `deleteRoomMembership` also handles cleaning up the guest role for any cross-school users who no longer belong to any room on that school.

---

## 5. Authorization System

This is the most important section for understanding the rooms codebase. The authorization approach here differs from many other modules.

### 5.1 Two Sources of Permissions

Every authorization check in rooms combines **two independent permission sources**:

| Source | Where it comes from | What it governs |
|--------|--------------------|--------------------|
| **School permissions** | User's school roles (teacher, admin, etc.) | System-level capabilities, e.g. `SCHOOL_CREATE_ROOM`, `SCHOOL_ADMINISTRATE_ROOMS` |
| **Room permissions** | User's room role (ROOMEDITOR, ROOMVIEWER, etc.) | Room-specific capabilities, e.g. `ROOM_EDIT_CONTENT`, `ROOM_ADD_MEMBERS` |

Room roles carry permissions just like school roles do — they are stored as `Role` entities in the database and their permissions are resolved the same way. The difference is that room role permissions come from the user's entry in the room's `Group`, not from their school enrollment.

```typescript
// From room.rule.ts – how permissions are resolved:
const resolveSchoolPermissions = (user: User): Permission[] =>
    [...user.roles].flatMap((role) => role.permissions ?? []);

const resolveRoomPermissions = (user: User, object: RoomAuthorizable): Permission[] =>
    object.members
        .filter((member) => member.userId === user.id)
        .flatMap((member) => member.roles)
        .flatMap((role) => role.permissions ?? []);
```

### 5.2 RoomAuthorizable

📁 [room-authorizable.do.ts](../apps/server/src/modules/room-membership/do/room-authorizable.do.ts)

The `RoomAuthorizable` is what gets passed into every authorization check. It is **not** a domain object with business logic — it is a plain data container built for authorization purposes:

```typescript
export class RoomAuthorizable implements AuthorizableObject {
    public readonly roomId: EntityId;
    public readonly schoolId: EntityId;
    public readonly members: UserWithRoomRoles[];  // ALL members of the room
    
    // Each member carries their fully-resolved role DTO with permissions:
    // { userId, userSchoolId, roles: RoleDto[] }
}
```

`RoomMembershipService.getRoomAuthorizable(roomId)` builds this by loading the membership, fetching the group, resolving all roles with their permissions, and packaging it all together.

### 5.3 The Three Authorization Rules

All three rules live in `RoomMembershipModule` and are registered into the `AuthorizationInjectionService`, which makes them available to the global `AuthorizationService`.

#### RoomRule

📁 [room.rule.ts](../apps/server/src/modules/room-membership/authorization/room.rule.ts)

The primary rule. Applicable when the authorizable is a `RoomAuthorizable`.

It has **two modes of operation**:

**1. Standard interface** — used by the global `AuthorizationService` (e.g., from `RoomPermissionService`):
```typescript
hasPermission(user, roomAuthorizable, context): boolean
// Checks school access, required permissions, then read/write based on action
```

**2. Operation-based interface** — used directly in use cases for fine-grained checks:
```typescript
can(operation: RoomOperation, user, roomAuthorizable): boolean
listAllowedOperations(user, roomAuthorizable): Record<RoomOperation, boolean>
```

The full list of operations is:
```typescript
export const RoomOperationValues = [
    'accessRoom', 'accessRoomBoards',
    'addAllStudents', 'addExternalPersonByEmail', 'addMembers',
    'arrangeRooms', 'changeRolesOfMembers',
    'copyRoom', 'createRoom', 'deleteRoom',
    'editContent', 'getRoomMembers', 'getRoomMembersRedacted',
    'leaveRoom', 'shareRoom', 'updateRoom',
    'createRoomInvitationLinks', 'listRoomInvitationLinks',
    'updateRoomInvitationLinks', 'deleteRoomInvitationLinks',
    'viewContent', 'viewDraftContent', 'viewMemberlist',
] as const;
```

Each operation maps to a standalone permission check function:
```typescript
getOperationMap() {
    return {
        accessRoom: canAccessRoom,
        editContent: canEditContent,
        deleteRoom: canDeleteRoom,
        createRoom: canCreateRoom,         // Only school permissions needed
        addMembers: canAddMembers,          // Room + school permissions
        // ...
    }
}
```

Note that **`createRoom` takes no `RoomAuthorizable`** (the room does not yet exist) — it only checks whether the user has `SCHOOL_CREATE_ROOM` at the school level. The `can()` call passes `null` in this case.

**The locked room check** is also on `RoomRule`:
```typescript
public isLockedRoom(user, roomAuthorizable): boolean {
    // Returns false if the room has no owner AND the user can't administrate rooms
}
```

#### RoomMemberRule

📁 [room-member.rule.ts](../apps/server/src/modules/room-membership/authorization/room-member.rule.ts)

Used for operations on a **specific member** of a room (e.g., changing their role). It wraps a `RoomAuthorizable` and a specific `RoomMember` together:

```typescript
export class RoomMemberAuthorizable {
    public readonly roomAuthorizable: RoomAuthorizable;  // Context of the room
    public readonly member: RoomMember;                  // The member being acted on
}
```

Operations: `changeRole`, `passOwnershipTo`, `removeMember`.

Key logic highlights:
- You can **never change the role of the owner** directly — you must use `passOwnershipTo`
- You can only **pass ownership to a teacher** (not a student or external person)
- School admins (`SCHOOL_ADMINISTRATE_ROOMS`) can perform member operations on people from their own school, even without a room role

#### RoomInvitationLinkRule

📁 [room-invitation-link.rule.ts](../apps/server/src/modules/room-membership/authorization/room-invitation-link.rule.ts)

Covered in §6 below.

### 5.4 Authorization Flow in a Typical Use Case

Here is how a standard operation looks — `updateRoom` as an example:

```
RoomUc.updateRoom(userId, roomId, props)
    │
    ├─► authorizationService.getUserWithPermissions(userId)
    │   └─► loads User with all school roles + their permissions
    │
    ├─► roomMembershipService.getRoomAuthorizable(roomId)
    │   └─► loads RoomMembership → Group → all members with room roles + permissions
    │
    ├─► roomRule.can('updateRoom', user, roomAuthorizable)
    │   └─► canUpdateRoom():
    │       ├─► isLockedRoom? → false
    │       └─► user has ROOM_EDIT_ROOM permission in room? → true/false
    │
    └─► throwForbiddenIfFalse(...)
        └─► if false: throw ForbiddenException
```

After a successful authorization check, use cases also call `roomRule.listAllowedOperations()` and return it alongside the response, so the frontend knows which actions to show.

### 5.5 School Admin Override

A recurring pattern across the rules is a **school administrator bypass**. A user with `SCHOOL_ADMINISTRATE_ROOMS` often has access to rooms in their school even without a room role. Examples:

- `canAccessRoom`: School admins can see any room at their school
- `canDeleteRoom`: School admins can delete any room at their school
- `canAddMembers`: School admins can add members to rooms at their school
- `canGetRoomMembersRedacted`: Only for school admins (returns minimal member info)

This bypass explicitly **does not apply to locked rooms** for most operations — the point is to allow admins to fix locked rooms, not to act on them as if they were a member.

---

## 6. Invitation Links

### 6.1 Overview

Invitation links allow users to join a room without being explicitly added. They are highly configurable and have their own dedicated authorization rule.

📁 [room-invitation-link.do.ts](../apps/server/src/modules/room/domain/do/room-invitation-link.do.ts)

```typescript
export interface RoomInvitationLinkProps {
    id: EntityId;
    title: string;
    roomId: EntityId;
    creatorUserId: EntityId;
    creatorSchoolId: EntityId;
    
    // Access restrictions:
    restrictedToCreatorSchool: boolean;   // Only users from creator's school can use it
    isUsableByStudents: boolean;
    isUsableByExternalPersons: boolean;   // Feature-flagged
    activeUntil?: Date;                   // Expiry date
    
    // Behavior on use:
    requiresConfirmation: boolean;        // If true, user joins as ROOMAPPLICANT
}
```

The `startingRole` property encapsulates the join behavior:
```typescript
get startingRole(): RoomRole {
    return this.props.requiresConfirmation ? RoleName.ROOMAPPLICANT : RoleName.ROOMVIEWER;
}
```

### 6.2 Managing Links vs. Using Links

There are two distinct authorization concerns:

**Managing links** (create/update/delete/list) — handled by `RoomRule` operations:
- `createRoomInvitationLinks`, `updateRoomInvitationLinks`, `deleteRoomInvitationLinks`, `listRoomInvitationLinks`
- Requires both `SCHOOL_MANAGE_ROOM_INVITATIONLINKS` (school permission) and `ROOM_MANAGE_INVITATIONLINKS` (room permission)

**Using a link** (following it to join a room) — handled by `RoomInvitationLinkRule`:
- An unauthenticated flow (the user may not yet be registered in the system)
- Uses `RoomInvitationLinkAuthorizable`, which bundles the `RoomAuthorizable`, the specific link, the school name, and the feature config

### 6.3 RoomInvitationLinkAuthorizable

📁 [room-invitation-link-authorizable.do.ts](../apps/server/src/modules/room-membership/do/room-invitation-link-authorizable.do.ts)

```typescript
export class RoomInvitationLinkAuthorizable {
    public readonly roomAuthorizable: RoomAuthorizable;
    public readonly roomInvitationLink: RoomInvitationLink;
    public readonly schoolName: string;              // For user-facing error messages
    public readonly roomPublicApiConfig: RoomPublicApiConfig;  // Feature flags
}
```

### 6.4 The `useRoomInvitationLinks` Check

📁 [room-invitation-link.rule.ts](../apps/server/src/modules/room-membership/authorization/room-invitation-link.rule.ts)

Unlike `RoomRule`, the `RoomInvitationLinkRule.check()` method **throws typed `RoomInvitationLinkError` exceptions** instead of returning a boolean. This is because the link-use flow needs to communicate *why* the link cannot be used (expired, wrong school, student from another school, etc.) to display a meaningful error page.

The validation cascade for `useRoomInvitationLinks`:

```
checkAllowedToUseInvitationLink()
    │
    ├─► checkRoleValidity()
    │   ├─► Teachers: always allowed
    │   ├─► Students: only if isUsableByStudents = true
    │   └─► External persons: only if isUsableByExternalPersons = true
    │       AND feature flag FEATURE_ROOM_LINK_INVITATION_EXTERNAL_PERSONS_ENABLED
    │
    ├─► activeUntil check → EXPIRED error
    │
    ├─► checkCreatorSchoolRestriction()
    │   └─► If restrictedToCreatorSchool: user must be from creator's school
    │       (skipped for external persons using a link that allows them)
    │
    └─► checkStudentFromOtherSchool()
        └─► Students can never use a link created by a user from a different school
```

### 6.5 Use Link Flow

```
RoomInvitationLinkUc.useLink(userId, linkId)
    │
    ├─► authorizationService.getUserWithPermissions(userId)
    ├─► roomInvitationLinkService.findById(linkId)
    │
    ├─► roomMembershipService.getRoomInvitationLinkAuthorizable(link)
    │
    ├─► roomInvitationLinkRule.check('useRoomInvitationLinks', user, authorizable)
    │   └─► throws RoomInvitationLinkError on failure (not ForbiddenException)
    │
    ├─► ensureUserIsInRoom(link, userId)
    │   ├─► if already a member: returns current role (no-op)
    │   └─► if not: adds as ROOMVIEWER or ROOMAPPLICANT
    │
    └─► if role is ROOMAPPLICANT → throw ROOM_APPLICANT_WAITING error
        (user was added, but they need confirmation before entering)
```

---

## 7. Practical Guide: Adding a New Room Operation

### Step 1: Add to `RoomOperationValues`

📁 [room.rule.ts](../apps/server/src/modules/room-membership/authorization/room.rule.ts):

```typescript
export const RoomOperationValues = [
    // ...existing operations
    'myNewOperation',
] as const;
```

The `RoomOperation` type union is derived automatically from this array.

### Step 2: Write the Permission Check Function

Add a standalone function (not a method — see existing pattern) that takes `user` and `roomAuthorizable`:

```typescript
const canMyNewOperation = (user: User, roomAuthorizable: RoomAuthorizable): boolean => {
    // Check locked room first, if applicable to your operation:
    if (isLockedRoom(roomAuthorizable)) {
        return false;
    }
    
    const { schoolPermissions, roomPermissions } = resolveUserPermissions(user, roomAuthorizable);
    
    // Example: require a room-level permission
    return roomPermissions.includes(Permission.ROOM_EDIT_CONTENT);
    
    // Or combine with school-level permission:
    // return roomPermissions.includes(Permission.ROOM_EDIT_CONTENT)
    //     || schoolPermissions.includes(Permission.SCHOOL_ADMINISTRATE_ROOMS);
};
```

### Step 3: Register in the Operation Map

```typescript
public getOperationMap() {
    return {
        // ...existing entries
        myNewOperation: canMyNewOperation,
    } satisfies Record<RoomOperation, OperationFn>;
}
```

### Step 4: Use in a Use Case

```typescript
public async myNewOperation(userId: EntityId, roomId: EntityId): Promise<void> {
    const user = await this.authorizationService.getUserWithPermissions(userId);
    const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomId);

    throwForbiddenIfFalse(this.roomRule.can('myNewOperation', user, roomAuthorizable));

    // Perform the operation...
}
```

The `listAllowedOperations()` method — which the frontend uses to know which buttons to show — will automatically include the new operation without any further changes.

---

## 8. Key Files Quick Reference

| Purpose | File |
|---------|------|
| Domain module | [room.module.ts](../apps/server/src/modules/room/room.module.ts) |
| API module | [room-api.module.ts](../apps/server/src/modules/room/room-api.module.ts) |
| Membership module | [room-membership.module.ts](../apps/server/src/modules/room-membership/room-membership.module.ts) |
| Room domain object | [room.do.ts](../apps/server/src/modules/room/domain/do/room.do.ts) |
| Room service | [room.service.ts](../apps/server/src/modules/room/domain/service/room.service.ts) |
| Room repo | [room.repo.ts](../apps/server/src/modules/room/repo/room.repo.ts) |
| RoomMembership domain object | [room-membership.do.ts](../apps/server/src/modules/room-membership/do/room-membership.do.ts) |
| RoomMembership service | [room-membership.service.ts](../apps/server/src/modules/room-membership/service/room-membership.service.ts) |
| RoomMembership repo | [room-membership.repo.ts](../apps/server/src/modules/room-membership/repo/room-membership.repo.ts) |
| RoomAuthorizable | [room-authorizable.do.ts](../apps/server/src/modules/room-membership/do/room-authorizable.do.ts) |
| RoomMemberAuthorizable | [room-member-authorizable.do.ts](../apps/server/src/modules/room-membership/do/room-member-authorizable.do.ts) |
| Primary auth rule | [room.rule.ts](../apps/server/src/modules/room-membership/authorization/room.rule.ts) |
| Member auth rule | [room-member.rule.ts](../apps/server/src/modules/room-membership/authorization/room-member.rule.ts) |
| Invitation link rule | [room-invitation-link.rule.ts](../apps/server/src/modules/room-membership/authorization/room-invitation-link.rule.ts) |
| Main use case | [room.uc.ts](../apps/server/src/modules/room/api/room.uc.ts) |
| REST controller | [room.controller.ts](../apps/server/src/modules/room/api/room.controller.ts) |
| Invitation link UC | [room-invitation-link.uc.ts](../apps/server/src/modules/room/api/room-invitation-link.uc.ts) |
| Invitation link domain object | [room-invitation-link.do.ts](../apps/server/src/modules/room/domain/do/room-invitation-link.do.ts) |
| Invitation link authorizable | [room-invitation-link-authorizable.do.ts](../apps/server/src/modules/room-membership/do/room-invitation-link-authorizable.do.ts) |
| Group domain object | [group.ts](../apps/server/src/modules/group/domain/group.ts) |

---

## 9. Suggested Exploration Order

For hands-on exploration after this presentation:

1. **Start with the domain objects:** Read `room.do.ts`, then `room-membership.do.ts` to understand the data split between the two modules
2. **Understand the data model:** Follow `RoomMembershipService.createNewRoomMembership()` to see how a room, a group, and a membership record are created together
3. **Understand authorization:** Read `room-authorizable.do.ts`, then `room.rule.ts` top to bottom — pay attention to how school and room permissions are combined, and when the locked room check applies
4. **Follow an operation end-to-end:** Trace `updateRoom` from `room.controller.ts` → `room.uc.ts` → auth check → `room.service.ts` → `room.repo.ts`
5. **Study member operations:** Look at `RoomUc.changeRoleOfMember()` to see how `RoomMemberAuthorizable` is built and used with `RoomMemberRule`
6. **Explore invitation links:** Follow `useLink()` in `room-invitation-link.uc.ts` and contrast the error-throwing style in `RoomInvitationLinkRule` with the boolean-returning style of `RoomRule`

---

*Document prepared for technical handover, June 2026*
