# Room Member Module

The Room Member module manages the association between users and rooms, handling permissions and roles within rooms. This module is designed to be injected into the Room module for managing user access and roles within rooms.

## Data Structure

### RoomMemberEntity

The core entity of this module is the `RoomMemberEntity`, which represents a user's membership in a room.

```typescript
@Entity({ tableName: 'room-members' })
export class RoomMemberEntity extends BaseEntityWithTimestamps implements RoomMemberProps {
    @Property()
    @Index()
    roomId!: ObjectId;

    @OneToOne(() => GroupEntity, { owner: true, orphanRemoval: true })
    userGroup!: GroupEntity;

    @Property({ persist: false })
    domainObject: RoomMember | undefined;
}
```

Let's break down the structure:

1. `@Entity({ tableName: 'room-members' })`: This decorator marks the class as an entity and specifies the table name in the database.

2. `extends BaseEntityWithTimestamps`: The entity inherits from a base class that likely includes common fields like `id`, `createdAt`, and `updatedAt`.

3. `implements RoomMemberProps`: The entity implements an interface that defines its properties.

4. `roomId: ObjectId`: This property represents the ID of the room to which this member belongs. It's indexed for faster queries.

5. `userGroup: GroupEntity`: This is a one-to-one relationship with the `GroupEntity`. The `owner: true` option means this entity owns the relationship, and `orphanRemoval: true` means that if this entity is deleted, the associated `GroupEntity` will also be deleted.

6. `domainObject: RoomMember | undefined`: This is a non-persisted property that can hold a reference to the domain object representation of this entity.

### GroupEntity

The `userGroup` property uses the `GroupEntity` from the Group module. This structure allows for multiple users to be associated with a room through a single group.

```typescript
class GroupEntity {
    id: EntityId;
    name: string;
    users: GroupUserEmbeddable[];
    // other properties...
}
```

### GroupUserEmbeddable

Each user in the group is represented by a `GroupUserEmbeddable`:

```typescript
class GroupUserEmbeddable {
    user: User;
    role: Role;
}
```

This structure allows for flexible assignment of roles to users within the context of a room.

## Key Points

1. The `RoomMemberEntity` doesn't directly store user IDs or roles. Instead, it uses a `GroupEntity` to manage this information.
2. This design allows for easy management of multiple users and roles for a single room.
3. The `roomId` is stored directly on the `RoomMemberEntity` for efficient querying of members for a specific room.
4. The `domainObject` property facilitates the separation between the database entity and the domain object, following domain-driven design principles.

This structure provides a flexible and scalable way to manage room memberships, allowing for complex permission and role scenarios within rooms.

## Service

The `RoomMemberService` is a service for the `RoomMember` entity. It provides methods for creating, updating, and deleting `RoomMember` entities.

```typescript
class RoomMemberService {
	constructor(private readonly roomMembersRepo: RoomMemberRepo) {}
}
```

## Usage

The `RoomMemberService` is designed to be injected into the `Room` module for managing user access and roles within rooms.

## API

There is no API for now. Member specific writes/reads can be implemented by adding an API to the RoomMember module.
Like adding/removing users to a room.

