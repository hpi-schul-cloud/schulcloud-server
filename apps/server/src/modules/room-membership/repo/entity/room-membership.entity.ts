import { Entity, Index, Property, Unique } from '@mikro-orm/core';
import { ObjectIdType } from '@shared/repo/types/object-id.type';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { RoomMembership, RoomMembershipProps } from '../../do/room-membership.do';

@Entity({ tableName: 'room-memberships' })
@Unique({ properties: ['roomId', 'userGroupId'] })
export class RoomMembershipEntity extends BaseEntityWithTimestamps implements RoomMembershipProps {
	@Unique()
	@Property({ type: ObjectIdType, fieldName: 'room' })
	roomId!: EntityId;

	@Index()
	@Property({ type: ObjectIdType, fieldName: 'userGroup' })
	userGroupId!: EntityId;

	@Index()
	@Property({ type: ObjectIdType, fieldName: 'school' })
	schoolId!: EntityId;

	@Property({ persist: false })
	domainObject: RoomMembership | undefined;
}
