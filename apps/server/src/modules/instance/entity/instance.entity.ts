import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';

export interface InstanceEntityProps {
	id?: EntityId;

	name: string;
}

@Entity({ tableName: 'instances' })
export class InstanceEntity extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	constructor(props: InstanceEntityProps) {
		super();
		if (props.id) {
			this.id = props.id;
		}
		this.name = props.name;
	}
}
