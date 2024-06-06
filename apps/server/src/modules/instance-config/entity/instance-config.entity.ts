import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';

export interface InstanceConfigEntityProps {
	id?: EntityId;

	name: string;
}

@Entity({ tableName: 'instance-configs' })
export class InstanceConfigEntity extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	constructor(props: InstanceConfigEntityProps) {
		super();
		if (props.id) {
			this.id = props.id;
		}
		this.name = props.name;
	}
}
