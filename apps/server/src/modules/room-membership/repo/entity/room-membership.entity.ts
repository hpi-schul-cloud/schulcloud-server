import { Entity, Property, Unique } from '@mikro-orm/core';
import { AuthorizableObject } from '@shared/domain/domain-object';
import { ObjectIdType } from '@shared/repo/types/object-id.type';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { RoomMembership } from '../../do/room-membership.do';

export interface RoomMembershipEntityProps extends AuthorizableObject {
	id: EntityId;
	roomId: EntityId;
	userGroupId: EntityId;
	createdAt: Date;
	updatedAt: Date;
}

@Entity({ tableName: 'room-memberships' })
@Unique({ properties: ['roomId', 'userGroupId'] })
export class RoomMembershipEntity extends BaseEntityWithTimestamps implements RoomMembershipEntityProps {
	@Unique()
	@Property({ type: ObjectIdType, fieldName: 'room' })
	roomId!: EntityId;

	@Property({ type: ObjectIdType, fieldName: 'userGroup' })
	userGroupId!: EntityId;

	@Property({ persist: false })
	domainObject: RoomMembership | undefined;
}
