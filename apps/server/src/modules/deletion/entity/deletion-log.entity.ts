import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, EntityId } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';

export interface DeletionLogEntityProps {
	id: EntityId;
	createdAt?: Date;
	updatedAt?: Date;
	scope?: string;
	operation?: string;
	docIds?: ObjectId[];
	deletionRequestId?: ObjectId;
}

@Entity({ tableName: 'deletionlogs' })
export class DeletionLogEntity extends BaseEntityWithTimestamps {
	@Property({ nullable: true })
	scope?: string;

	@Property({ nullable: true })
	operation?: string;

	@Property({ nullable: true })
	docIds?: ObjectId[];

	@Property({ nullable: true })
	deletionRequestId?: ObjectId;

	constructor(props: DeletionLogEntityProps) {
		super();

		if (props.id !== undefined) {
			this.id = props.id;
		}

		if (props.createdAt !== undefined) {
			this.createdAt = props.createdAt;
		}

		if (props.scope !== undefined) {
			this.scope = props.scope;
		}

		if (props.operation !== undefined) {
			this.operation = props.operation;
		}

		if (props.updatedAt !== undefined) {
			this.updatedAt = props.updatedAt;
		}

		if (props.deletionRequestId !== undefined) {
			this.deletionRequestId = props.deletionRequestId;
		}

		this.docIds = props.docIds;
	}
}
