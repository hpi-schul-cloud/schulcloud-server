import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { Room, RoomProps } from '../../domain/do/room.do';
import { RoomColor } from '../../domain/type';

@Entity({ tableName: 'rooms' })
export class RoomEntity extends BaseEntityWithTimestamps implements RoomProps {
	@Property({ nullable: false })
	name!: string;

	@Property({ nullable: false })
	color!: RoomColor;

	@Property({ nullable: true })
	startDate?: Date;

	@Property({ nullable: true })
	endDate?: Date;

	@Property({ persist: false })
	domainObject: Room | undefined;
}
