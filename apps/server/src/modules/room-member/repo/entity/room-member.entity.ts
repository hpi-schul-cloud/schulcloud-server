import { Entity, Property, Unique } from '@mikro-orm/core';
import { AuthorizableObject } from '@shared/domain/domain-object';
import { ObjectIdType } from '@shared/repo/types/object-id.type';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { RoomMember } from '../../do/room-member.do';

export interface RoomMemberEntityProps extends AuthorizableObject {
	id: EntityId;
	roomId: EntityId;
	userGroupId: EntityId;
	createdAt: Date;
	updatedAt: Date;
}

@Entity({ tableName: 'room-members' })
@Unique({ properties: ['roomId', 'userGroupId'] })
export class RoomMemberEntity extends BaseEntityWithTimestamps implements RoomMemberEntityProps {
	@Property()
	@Unique()
	@Property({ type: ObjectIdType })
	roomId!: EntityId;

	@Property({ type: ObjectIdType })
	userGroupId!: EntityId;

	@Property({ persist: false })
	domainObject: RoomMember | undefined;
}
