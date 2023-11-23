import { Entity, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { EntityId } from '@shared/domain/types';
import { DeletionDomainModel } from '../domain/types/deletion-domain-model.enum';
import { DeletionOperationModel } from '../domain/types/deletion-operation-model.enum';

export interface DeletionLogEntityProps {
	id?: EntityId;
	domain: DeletionDomainModel;
	operation?: DeletionOperationModel;
	modifiedCount?: number;
	deletedCount?: number;
	deletionRequestId?: ObjectId;
	createdAt?: Date;
	updatedAt?: Date;
}

@Entity({ tableName: 'deletionlogs' })
export class DeletionLogEntity extends BaseEntityWithTimestamps {
	@Property()
	domain: DeletionDomainModel;

	@Property({ nullable: true })
	operation?: DeletionOperationModel;

	@Property({ nullable: true })
	modifiedCount?: number;

	@Property({ nullable: true })
	deletedCount?: number;

	@Property({ nullable: true })
	deletionRequestId?: ObjectId;

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
	}
}
