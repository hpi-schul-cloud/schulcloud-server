import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { SynchronizationStatusModel } from '../../domain/types';

export interface SynchronizationEntityProps {
	id?: EntityId;
	count?: number;
	failureCause?: string;
	status?: SynchronizationStatusModel;
	createdAt?: Date;
	updatedAt?: Date;
}

@Entity({ tableName: 'synchronizations' })
export class SynchronizationEntity extends BaseEntityWithTimestamps {
	@Property({ nullable: true })
	count?: number;

	@Property({ nullable: true })
	failureCause?: string;

	@Property({ nullable: true })
	status?: SynchronizationStatusModel;

	constructor(props: SynchronizationEntityProps) {
		super();
		if (props.id !== undefined) {
			this.id = props.id;
		}

		if (props.count !== undefined) {
			this.count = props.count;
		}

		if (props.failureCause !== undefined) {
			this.failureCause = props.failureCause;
		}

		if (props.status !== undefined) {
			this.status = props.status;
		}

		if (props.createdAt !== undefined) {
			this.createdAt = props.createdAt;
		}

		if (props.updatedAt !== undefined) {
			this.updatedAt = props.updatedAt;
		}
	}
}
