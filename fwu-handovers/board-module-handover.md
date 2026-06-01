# Technical Handover: Board Module

## Document Purpose & Structure

This document guides new developers through the Board module codebase. It's designed to be presented by someone familiar with the code, not read in isolation. The structure follows a logical learning path: concepts → data model → key flows → practical guidance.

---

## 1. Overview & Conceptual Foundation

### 1.1 What is the Board?

The Board module ("Bereiche" in German) provides **collaborative, real-time editing of structured content** for educational contexts. It's used for lesson preparation, teaching, and follow-up.

**Two primary implementations exist:**
- **ColumnBoard** (primary focus) – A kanban-style board with columns containing cards
- **MediaBoard** – A specialized board for organizing media/tool resources

### 1.2 Core Design Principle: The BoardNode Tree

Every board is a **tree of `BoardNode` objects**. This is the central abstraction:

```
ColumnBoard (root)
├── Column
│   ├── Card
│   │   ├── RichTextElement
│   │   ├── FileElement
│   │   └── LinkElement
│   └── Card
│       └── DrawingElement
└── Column
    └── Card
```

**Key characteristics:**
- Each node type defines **what children it can have** via `canHaveChild()`
- **Structural nodes**: `ColumnBoard`, `Column`, `Card` (organize content)
- **Content elements**: `RichTextElement`, `FileElement`, `LinkElement`, etc. (leaf nodes with actual content)

📁 **Entry point:** [board-node.do.ts](../apps/server/src/modules/board/domain/board-node.do.ts)

---

## 2. Module Architecture

### 2.1 Module Layering

The board uses multiple NestJS modules for separation of concerns:

| Module | Purpose | File |
|--------|---------|------|
| `BoardModule` | Core domain logic, services, repo | [board.module.ts](../apps/server/src/modules/board/board.module.ts) |
| `BoardApiModule` | REST API controllers + use cases | [board-api.module.ts](../apps/server/src/modules/board/board-api.module.ts) |
| `BoardWsApiModule` | WebSocket gateway for real-time | [board-ws-api.module.ts](../apps/server/src/modules/board/board-ws-api.module.ts) |
| `MediaBoardModule` | MediaBoard-specific logic | [media-board.module.ts](../apps/server/src/modules/board/media-board.module.ts) |

```
┌─────────────────────────────────────────────────────────┐
│                    BoardApiModule                        │
│                   BoardWsApiModule                       │
│  (Controllers, Gateways, Use Cases)                     │
├─────────────────────────────────────────────────────────┤
│                     BoardModule                          │
│  (Domain Objects, Services, Repository, Authorization)  │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Directory Structure

```
board/
├── authorisation/          # BoardNodeRule - authorization logic
├── controller/             # REST controllers + DTOs + mappers
├── domain/                 # Domain objects (BoardNode, elements)
│   ├── types/              # TypeScript types, enums
│   ├── media-board/        # MediaBoard-specific domain objects
│   └── events/             # Domain events
├── gateway/                # WebSocket gateway
├── repo/                   # Persistence (single entity approach)
│   └── entity/             # MikroORM entity
├── service/                # Domain services
│   └── internal/           # Internal services (context, copy, etc.)
│       └── board-context/  # Context resolution (Room, Course, User)
├── uc/                     # Use cases (orchestration layer)
└── saga/                   # CQRS saga steps (e.g., room copy)
```

---

## 3. Domain Model Deep Dive

### 3.1 The BoardNode Base Class

📁 [board-node.do.ts](../apps/server/src/modules/board/domain/board-node.do.ts)

All nodes inherit from `BoardNode<T extends BoardNodeProps>`:

```typescript
export abstract class BoardNode<T extends BoardNodeProps> extends DomainObject<T> {
    get children(): readonly AnyBoardNode[]
    get parentId(): EntityId | undefined
    get ancestorIds(): readonly EntityId[]  // Full path to root
    get rootId(): EntityId
    get level(): number
    get position(): number
    
    addChild(child: AnyBoardNode, position?: number): void
    removeChild(child: AnyBoardNode): void
    abstract canHaveChild(childNode: AnyBoardNode): boolean  // Type safety!
}
```

**Path Management:** Each node stores its `path` as a materialized path string (e.g., `"rootId,grandparentId,parentId"`). This enables efficient tree queries.

### 3.2 Type System & Registration

📁 [type-mapping.ts](../apps/server/src/modules/board/domain/type-mapping.ts)

All node types are registered in a central mapping:

```typescript
const BoardNodeTypeToConstructor = {
    [BoardNodeType.COLUMN_BOARD]: ColumnBoard,
    [BoardNodeType.COLUMN]: Column,
    [BoardNodeType.CARD]: Card,
    [BoardNodeType.RICH_TEXT_ELEMENT]: RichTextElement,
    [BoardNodeType.FILE_ELEMENT]: FileElement,
    // ... more types
}
```

**Helper functions:**
- `getBoardNodeConstructor(type)` – Get class from enum
- `getBoardNodeType(boardNode)` – Get enum from instance

### 3.3 ColumnBoard Structure

📁 [colum-board.do.ts](../apps/server/src/modules/board/domain/colum-board.do.ts)

```typescript
export class ColumnBoard extends BoardNode<ColumnBoardProps> {
    title: string
    context: BoardExternalReference  // Links to Room/Course/User
    isVisible: boolean               // Draft mode
    layout: BoardLayout              // COLUMNS or LIST
    readersCanEdit: boolean          // Collaboration setting
    
    canHaveChild(childNode: AnyBoardNode): boolean {
        return childNode instanceof Column;  // Only columns allowed
    }
}
```

### 3.4 Context System

Each board has a **context** that determines:
- Who has access (authorization)
- Configuration options
- Where the board "lives"

**Context Types:**
| Type | Use Case |
|------|----------|
| `Room` | Primary – boards within collaborative rooms |
| `Course` | Legacy – boards within courses |
| `User` | Personal boards (future) |

📁 [board-external-reference.ts](../apps/server/src/modules/board/domain/types/board-external-reference.ts)

---

## 4. Persistence Layer

### 4.1 Single-Entity Approach (Important!)

📁 [board-node.entity.ts](../apps/server/src/modules/board/repo/entity/board-node.entity.ts)

**All board nodes are stored in a single MongoDB collection** (`boardnodes`) using one entity class:

```typescript
@Entity({ tableName: 'boardnodes' })
export class BoardNodeEntity extends BaseEntityWithTimestamps {
    // Generic tree fields (all nodes)
    @Index() path: string
    level: number
    position: number
    @Index() type: BoardNodeType
    
    // Type-specific fields (nullable, used by respective types)
    title?: string           // Card, Column, ColumnBoard, LinkElement...
    context?: Context        // ColumnBoard, MediaBoard
    text?: string           // RichTextElement
    url?: string            // LinkElement
    // ... many more optional fields
}
```

**Why this approach?**
- Efficient tree queries using materialized paths
- Single query can fetch entire subtrees
- Trade-off: Entity has many nullable fields

### 4.2 TreeBuilder – Reconstructing Domain Objects

📁 [tree-builder.ts](../apps/server/src/modules/board/repo/tree-builder.ts)

The `TreeBuilder` converts flat entity arrays back into a tree of domain objects:

```typescript
export class TreeBuilder {
    build(entity: BoardNodeEntity): AnyBoardNode {
        // 1. Get children from pre-grouped map
        // 2. Recursively build child trees
        // 3. Instantiate correct domain class using type mapping
        // 4. Attach to identity map (prevents duplicates)
    }
}
```

### 4.3 BoardNodeRepo

📁 [board-node.repo.ts](../apps/server/src/modules/board/repo/board-node.repo.ts)

Key methods:
```typescript
findById(id, depth?)              // Load node + descendants to depth
findByIds(ids, depth?)            // Batch load
findByExternalReference(ref)      // Find boards by context
save(boardNode)                   // Persist node + all children
delete(boardNode)                 // Remove node + all descendants
```

**Note:** The repo uses a recursive `persist()` that walks the entire tree.

---

## 5. Authorization System

### 5.1 BoardNodeAuthorizable

📁 [board-node-authorizable.do.ts](../apps/server/src/modules/board/domain/board-node-authorizable.do.ts)

Authorization requires building a `BoardNodeAuthorizable` containing:

```typescript
interface BoardNodeAuthorizableProps {
    boardNode: AnyBoardNode      // The node being authorized
    rootNode: AnyBoardNode       // Always needed for context
    parentNode?: AnyBoardNode    // For structural checks
    users: UserWithBoardRoles[]  // All users with their board roles
    boardConfiguration: BoardConfiguration  // Feature flags
}
```

**Board Roles:**
- `ADMIN` – Full control (room owners, admins)
- `EDITOR` – Can edit content
- `READER` – View only (unless `readersCanEdit` is true)

### 5.2 BoardNodeRule

📁 [board-node.rule.ts](../apps/server/src/modules/board/authorisation/board-node.rule.ts)

**Two modes of operation:**

1. **Standard Rule Interface** (for external services like FileStorage):
```typescript
hasPermission(user, authorizable, context): boolean
```

2. **Extended Operation-Based Interface** (for board-internal use):
```typescript
can(operation: BoardOperation, user, authorizable): boolean
listAllowedOperations(user, authorizable): Record<BoardOperation, boolean>
```

**Operations are granular:**
```typescript
const BoardOperationValues = [
    'findBoard', 'deleteBoard', 'updateBoardTitle',  // Board ops
    'createColumn', 'moveColumn', 'deleteColumn',     // Column ops
    'createCard', 'moveCard', 'copyCard',             // Card ops
    'createElement', 'updateElement', 'deleteElement', // Element ops
    // ... many more
]
```

Each operation maps to a permission check function:
```typescript
getOperationMap() {
    return {
        updateBoardTitle: _canEditBoard,
        deleteBoard: _canManageBoard,
        createElement: _canEditBoard,
        // ...
    }
}
```

### 5.3 Context Resolution Flow

📁 [board-context-resolver.service.ts](../apps/server/src/modules/board/service/internal/board-context/board-context-resolver.service.ts)

```
User Request
    │
    ▼
BoardNodeAuthorizableService.getBoardAuthorizable(boardNode)
    │
    ├─► Find root node (to get context reference)
    │
    ├─► BoardContextResolverService.resolve(context)
    │   │
    │   ├─► Room? → RoomBoardContext (fetches Room + RoomAuthorizable)
    │   ├─► Course? → CourseBoardContext (fetches Course members)
    │   └─► User? → UserBoardContext
    │
    └─► Build BoardNodeAuthorizable with:
        - users + their board roles (derived from context)
        - board configuration (derived from context + root node)
```

**PreparedBoardContext Interface:**

📁 [prepared-board-context.interface.ts](../apps/server/src/modules/board/service/internal/board-context/prepared-board-context.interface.ts)

```typescript
interface PreparedBoardContext {
    getUsersWithBoardRoles(): UserWithBoardRoles[]
    getBoardConfiguration(rootNode): BoardConfiguration
}
```

**Room Context Example:**

📁 [room-board-context.ts](../apps/server/src/modules/board/service/internal/board-context/room-board-context.ts)

---

## 6. WebSocket Real-Time Collaboration

### 6.1 Gateway Structure

📁 [board-collaboration.gateway.ts](../apps/server/src/modules/board/gateway/board-collaboration.gateway.ts)

Uses NestJS WebSocket Gateway with Socket.IO:

```typescript
@WebSocketGateway(websocketOptions)
@WsJwtAuthentication()
export class BoardCollaborationGateway {
    @SubscribeMessage('update-board-title-request')
    async updateBoardTitle(socket: Socket, data: UpdateBoardTitleMessageParams) {
        // 1. Get current user from socket
        // 2. Call use case (same as REST)
        // 3. Emit success to ALL clients on this board
        // 4. On error, emit failure only to requesting client
    }
}
```

### 6.2 Message Pattern

**Request:** `{action}-request` (e.g., `update-board-title-request`)
**Success:** `{action}-success` → broadcast to all board participants
**Failure:** `{action}-failure` → only to requesting client

### 6.3 Frontend Integration Points

| Event Type | Direction | Purpose |
|------------|-----------|---------|
| `fetch-board-request` | Client → Server | Load board skeleton |
| `fetch-cards-request` | Client → Server | Load card contents (batched) |
| `*-success` | Server → All Clients | Sync changes |
| `*-failure` | Server → Client | Error feedback |

**Note:** MongoDB IO Adapter is used for multi-instance synchronization.

---

## 7. Copy Functionality

### 7.1 Overview

Board copying is complex due to:
- Deep tree structures
- External resource references (files, tools)
- Cross-context copying (different schools/rooms)

📁 [board-copy.service.ts](../apps/server/src/modules/board/service/internal/board-copy.service.ts)
📁 [board-node-copy.service.ts](../apps/server/src/modules/board/service/internal/board-node-copy.service.ts)

### 7.2 Copy Flow

```
ColumnBoardService.copyColumnBoard()
    │
    ├─► BoardCopyService.copyColumnBoard()
    │   │
    │   └─► BoardNodeCopyService (recursive tree copy)
    │       │
    │       ├─► For each node: create copy with new IDs
    │       ├─► Handle element-specific copying (files, tools)
    │       └─► Build CopyStatus tree
    │
    └─► ColumnBoardService.swapLinkedIdsInBoards()
        (Fix internal references after copy)
```

### 7.3 CopyStatus

The copy operation returns a `CopyStatus` tree mirroring the board structure, tracking success/failure of each node copy.

### 7.4 Saga Integration

📁 [saga/](../apps/server/src/modules/board/saga/)

When a Room is copied, the `CopyRoomBoardsStep` saga step handles copying all boards within it.

---

## 8. External Integrations (Overview)

| Integration | Element Type | Communication |
|-------------|--------------|---------------|
| **tldraw** | `DrawingElement` | TldrawClientModule (HTTP) |
| **H5P** | `H5pElement` | RabbitMQ via H5pEditorClientModule |
| **FileStorage** | `FileElement` | RabbitMQ via FilesStorageClientModule |
| **Etherpad** | `CollaborativeTextEditorElement` | CollaborativeTextEditorModule |
| **BBB** | `VideoConferenceElement` | VideoConference module |
| **LTI Tools** | `ExternalToolElement` | ContextExternalToolModule |

These are abstracted behind client modules; element-specific details are in the respective element's update/delete hooks.

---

## 9. Practical Guide: Adding a New Element Type

### Step 1: Define the Domain Object

📁 Create `domain/my-new-element.do.ts`:

```typescript
import { BoardNode } from './board-node.do';
import { AnyBoardNode, MyNewElementProps } from './types';

export class MyNewElement extends BoardNode<MyNewElementProps> {
    get myProperty(): string {
        return this.props.myProperty;
    }
    
    set myProperty(value: string) {
        this.props.myProperty = value;
    }
    
    canHaveChild(childNode: AnyBoardNode): boolean {
        return false; // Elements are typically leaves
    }
}
```

### Step 2: Define Props

📁 Add to [board-node-props.ts](../apps/server/src/modules/board/domain/types/board-node-props.ts):

```typescript
export interface MyNewElementProps extends BoardNodeProps {
    myProperty: string;
}
```

### Step 3: Register Type

📁 [board-node-type.enum.ts](../apps/server/src/modules/board/domain/types/board-node-type.enum.ts):
```typescript
export enum BoardNodeType {
    // ...existing types
    MY_NEW_ELEMENT = 'my-new-element',
}
```

📁 [content-element-type.enum.ts](../apps/server/src/modules/board/domain/types/content-element-type.enum.ts):
```typescript
export enum ContentElementType {
    // ...existing types
    MY_NEW_ELEMENT = 'my-new-element',
}
```

📁 [type-mapping.ts](../apps/server/src/modules/board/domain/type-mapping.ts):
```typescript
const BoardNodeTypeToConstructor = {
    // ...existing mappings
    [BoardNodeType.MY_NEW_ELEMENT]: MyNewElement,
}
```

### Step 4: Add Entity Fields

📁 [board-node.entity.ts](../apps/server/src/modules/board/repo/entity/board-node.entity.ts):

```typescript
@Property({ type: 'string', nullable: true })
myProperty: string | undefined;
```

### Step 5: Update Type Guards

📁 [any-content-element.ts](../apps/server/src/modules/board/domain/types/any-content-element.ts):

```typescript
export type AnyContentElement = 
    | RichTextElement
    | MyNewElement  // Add here
    // ...
```

### Step 6: Add Factory Method

📁 [board-node.factory.ts](../apps/server/src/modules/board/domain/board-node.factory.ts):

```typescript
buildMyNewElement(props: { myProperty: string }): MyNewElement {
    return new MyNewElement({
        id: new ObjectId().toHexString(),
        path: ROOT_PATH,
        level: 0,
        position: 0,
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        myProperty: props.myProperty,
    });
}
```

### Step 7: Add DTOs and Mapper

📁 Create DTOs in [controller/dto/](../apps/server/src/modules/board/controller/dto/) and mapper in [controller/mapper/](../apps/server/src/modules/board/controller/mapper/)

### Step 8: Update ContentElementUpdateService

📁 [content-element-update.service.ts](../apps/server/src/modules/board/service/internal/content-element-update.service.ts):

Add update logic for your element's content.

---

## 10. Practical Guide: Adding a New Operation

### Step 1: Add to BoardOperationValues

📁 [board-node.rule.ts](../apps/server/src/modules/board/authorisation/board-node.rule.ts):

```typescript
export const BoardOperationValues = [
    // ...existing operations
    'myNewOperation',
] as const;
```

### Step 2: Create Permission Check Function

```typescript
const canMyNewOperation = (user: User, authorizable: BoardNodeAuthorizable): boolean => {
    if (authorizable.boardConfiguration.isLocked) return false;
    
    const permissions = authorizable.getUserPermissions(user.id);
    // Your logic here
    return permissions.includes(Permission.SOME_PERMISSION);
};
```

### Step 3: Add to Operation Map

```typescript
getOperationMap() {
    return {
        // ...existing mappings
        myNewOperation: canMyNewOperation,
    }
}
```

### Step 4: Use in Use Case

```typescript
async myNewOperation(userId: EntityId, boardId: EntityId) {
    const board = await this.boardNodeService.findByClassAndId(ColumnBoard, boardId);
    const authorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(board);
    const user = await this.authorizationService.getUserWithPermissions(userId);
    
    throwForbiddenIfFalse(this.boardNodeRule.can('myNewOperation', user, authorizable));
    
    // Perform operation
}
```

---

## 11. Known Limitations & Planned Improvements

⚠️ **From the official documentation (Q1/2026):**

| Area | Status | Notes |
|------|--------|-------|
| **Tasks Element** | Missing | Would enable homework/assignment submissions |
| **Trait-based System** | Planned | Better separation of node types and features |
| **External Element Implementations** | Planned | Allow elements outside board module |
| **Fractional Indexing** | Planned | Better conflict resolution for concurrent edits |
| **Performance Optimizations** | Needed | Especially for authorization and partial loads |
| **Cross-board Content Retrieval** | Planned | "Task Overview" across boards |
| **Partial Access Control** | Planned | Hide columns/cards from certain users |

---

## 12. Key Files Quick Reference

| Purpose | File |
|---------|------|
| Module entry point | [board.module.ts](../apps/server/src/modules/board/board.module.ts) |
| Base domain object | [board-node.do.ts](../apps/server/src/modules/board/domain/board-node.do.ts) |
| ColumnBoard | [colum-board.do.ts](../apps/server/src/modules/board/domain/colum-board.do.ts) |
| Type registration | [type-mapping.ts](../apps/server/src/modules/board/domain/type-mapping.ts) |
| Entity definition | [board-node.entity.ts](../apps/server/src/modules/board/repo/entity/board-node.entity.ts) |
| Repository | [board-node.repo.ts](../apps/server/src/modules/board/repo/board-node.repo.ts) |
| Tree reconstruction | [tree-builder.ts](../apps/server/src/modules/board/repo/tree-builder.ts) |
| Authorization rule | [board-node.rule.ts](../apps/server/src/modules/board/authorisation/board-node.rule.ts) |
| Auth service | [board-node-authorizable.service.ts](../apps/server/src/modules/board/service/board-node-authorizable.service.ts) |
| Context resolution | [board-context-resolver.service.ts](../apps/server/src/modules/board/service/internal/board-context/board-context-resolver.service.ts) |
| WebSocket gateway | [board-collaboration.gateway.ts](../apps/server/src/modules/board/gateway/board-collaboration.gateway.ts) |
| Main use case | [board.uc.ts](../apps/server/src/modules/board/uc/board.uc.ts) |
| REST controller | [board.controller.ts](../apps/server/src/modules/board/controller/board.controller.ts) |

---

## 13. Suggested Exploration Order

For hands-on exploration after this presentation:

1. **Start with the domain model:** Read `board-node.do.ts`, then `colum-board.do.ts`, `column.do.ts`, `card.do.ts`
2. **Understand persistence:** Trace `BoardNodeRepo.findById()` → `TreeBuilder.build()`
3. **Follow an operation:** Pick `updateBoardTitle` and trace from controller → UC → service → repo
4. **Study authorization:** Follow `BoardUc.findBoard()` to see how `BoardNodeAuthorizable` is built and used
5. **Explore WebSocket:** Compare REST controller with gateway for the same operation

---

*Document prepared for technical handover, May 2026*
