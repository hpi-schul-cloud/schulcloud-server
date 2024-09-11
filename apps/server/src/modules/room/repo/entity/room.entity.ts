import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { Room, RoomProps } from '../../domain/do/room.do';

export interface RoomEntityProps {
	id?: string;
	name: string;
	color: string;
	startDate?: Date;
	untilDate?: Date;
}

@Entity({ tableName: 'rooms' })
export class RoomEntity extends BaseEntityWithTimestamps implements RoomProps {
	@Property()
	name: string;

	@Property()
	color: string;

	@Property({ nullable: true })
	startDate?: Date;

	@Property({ nullable: true })
	untilDate?: Date;

	@Property({ persist: false })
	domainObject: Room | undefined;

	constructor(props: RoomEntityProps) {
		super();
		if (props.id) {
			this.id = props.id;
		}
		this.name = props.name;
		this.color = props.color;
		this.startDate = props.startDate;
		this.untilDate = props.untilDate;
	}
}
