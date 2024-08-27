import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';

export interface RoomEntityProps {
	id?: string;
	name: string;
	color: string;
	startDate?: Date;
	untilDate?: Date;
}

@Entity({ tableName: 'rooms' })
export class RoomEntity extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	@Property()
	color: string;

	@Property()
	startDate?: Date;

	@Property()
	untilDate?: Date;

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
