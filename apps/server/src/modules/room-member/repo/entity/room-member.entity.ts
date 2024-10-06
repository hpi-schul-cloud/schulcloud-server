import { Entity, Index, OneToOne, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { GroupEntity } from '@src/modules/group/entity/group.entity';
import { RoomMember, RoomMemberProps } from '../../do/room-member.do';

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
