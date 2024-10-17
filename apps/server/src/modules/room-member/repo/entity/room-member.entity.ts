import { Entity, Index, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizableObject } from '@shared/domain/domain-object';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { RoomMember } from '../../do/room-member.do';

export interface RoomMemberEntityProps extends AuthorizableObject {
	id: EntityId;
	roomId: ObjectId;
	userGroupId: ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

@Entity({ tableName: 'room-members' })
export class RoomMemberEntity extends BaseEntityWithTimestamps implements RoomMemberEntityProps {
	@Property()
	@Index()
	roomId!: ObjectId;

	@Property()
	@Index()
	userGroupId!: ObjectId;

	@Property({ persist: false })
	domainObject: RoomMember | undefined;
}
