import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, EntityId } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { DeletionDomainModel } from '../domain/types/deletion-domain-model.enum';
import { DeletionOperationModel } from '../domain/types/deletion-operation-model.enum';

export interface DeletionLogEntityProps {
	id?: EntityId;
	domain?: DeletionDomainModel;
	operation?: DeletionOperationModel;
	modifiedCounter?: number;
	deletedCounter?: number;
	deletionRequestId?: ObjectId;
	createdAt?: Date;
	updatedAt?: Date;
}

@Entity({ tableName: 'deletionlogs' })
export class DeletionLogEntity extends BaseEntityWithTimestamps {
	@Property({ nullable: true })
	domain?: DeletionDomainModel;

	@Property({ nullable: true })
	operation?: DeletionOperationModel;

	@Property({ nullable: true })
	modifiedCounter?: number;

	@Property({ nullable: true })
	deletedCounter?: number;

	@Property({ nullable: true })
	deletionRequestId?: ObjectId;

	constructor(props: DeletionLogEntityProps) {
		super();
		if (props.id !== undefined) {
			this.id = props.id;
		}

		if (props.domain !== undefined) {
			this.domain = props.domain;
		}

		if (props.operation !== undefined) {
			this.operation = props.operation;
		}

		if (props.modifiedCounter !== undefined) {
			this.modifiedCounter = props.modifiedCounter;
		}

		if (props.deletedCounter !== undefined) {
			this.deletedCounter = props.deletedCounter;
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
