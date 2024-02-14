import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';

export interface SynchronizationEntityProps {
	id?: EntityId;
	count?: number;
	failure?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

@Entity({ tableName: 'synchronizations' })
export class SynchronizationEntity extends BaseEntityWithTimestamps {
	@Property({ nullable: true })
	count?: number;

	@Property({ nullable: true })
	failure?: string;

	constructor(props: SynchronizationEntityProps) {
		super();
		if (props.id !== undefined) {
			this.id = props.id;
		}

		if (props.count !== undefined) {
			this.count = props.count;
		}

		if (props.failure !== undefined) {
			this.failure = props.failure;
		}

		if (props.createdAt !== undefined) {
			this.createdAt = props.createdAt;
		}

		if (props.updatedAt !== undefined) {
			this.updatedAt = props.updatedAt;
		}
	}
}
