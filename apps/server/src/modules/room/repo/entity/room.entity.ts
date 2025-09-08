import { Entity, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { ObjectIdType } from '@shared/repo/types/object-id.type';
import { Room, RoomProps } from '../../domain/do/room.do';
import { RoomColor, RoomFeatures } from '../../domain/type';

@Entity({ tableName: 'rooms' })
export class RoomEntity extends BaseEntityWithTimestamps implements RoomProps {
	@Property({ nullable: false })
	name!: string;

	@Property({ nullable: false })
	color!: RoomColor;

	@Index()
	@Property({ type: ObjectIdType, fieldName: 'school', nullable: false })
	schoolId!: EntityId;

	@Property({ nullable: true })
	startDate?: Date;

	@Property({ nullable: true })
	endDate?: Date;

	@Property({ persist: false })
	domainObject: Room | undefined;

	@Property({ nullable: false })
	features!: RoomFeatures[];
}
