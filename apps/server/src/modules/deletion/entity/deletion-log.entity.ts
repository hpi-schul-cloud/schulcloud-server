import { Entity, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { DomainModel, EntityId } from '@shared/domain/types';
import { ObjectId } from 'bson';
import { DeletionOperationModel } from '../domain/types';

export interface DeletionLogEntityProps {
	id?: EntityId;
	domain: DomainModel;
	operation?: DeletionOperationModel;
	modifiedCount?: number;
	deletedCount?: number;
	deletionRequestId?: ObjectId;
	performedAt?: Date;
	createdAt?: Date;
	updatedAt?: Date;
}

@Entity({ tableName: 'deletionlogs' })
export class DeletionLogEntity extends BaseEntityWithTimestamps {
	@Property()
	domain: DomainModel;

	@Property({ nullable: true })
	operation?: DeletionOperationModel;

	@Property({ nullable: true })
	modifiedCount?: number;

	@Property({ nullable: true })
	deletedCount?: number;

	@Property({ nullable: true })
	deletionRequestId?: ObjectId;

	@Property({ nullable: true })
	@Index({ options: { expireAfterSeconds: 7776000 } })
	performedAt?: Date;

	constructor(props: DeletionLogEntityProps) {
		super();
		if (props.id !== undefined) {
			this.id = props.id;
		}

		this.domain = props.domain;

		if (props.operation !== undefined) {
			this.operation = props.operation;
		}

		if (props.modifiedCount !== undefined) {
			this.modifiedCount = props.modifiedCount;
		}

		if (props.deletedCount !== undefined) {
			this.deletedCount = props.deletedCount;
		}

		if (props.deletionRequestId !== undefined) {
			this.deletionRequestId = props.deletionRequestId;
		}

		if (props.createdAt !== undefined) {
			this.createdAt = props.createdAt;
		}

		if (props.updatedAt !== undefined) {
			this.updatedAt = props.updatedAt;
		}

		if (props.performedAt !== undefined) {
			this.performedAt = props.performedAt;
		}
	}
}
