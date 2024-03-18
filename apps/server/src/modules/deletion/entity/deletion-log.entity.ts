import { Entity, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { DomainName, EntityId, OperationType } from '@shared/domain/types';
import { ObjectId } from '@mikro-orm/mongodb';

export interface DeletionLogEntityProps {
	id?: EntityId;
	domain: DomainName;
	operation: OperationType;
	count: number;
	refs: EntityId[];
	deletionRequestId?: ObjectId;
	performedAt?: Date;
	createdAt?: Date;
	updatedAt?: Date;
}

@Entity({ tableName: 'deletionlogs' })
export class DeletionLogEntity extends BaseEntityWithTimestamps {
	@Property()
	domain: DomainName;

	@Property()
	operation: OperationType;

	@Property()
	count: number;

	@Property()
	refs: EntityId[];

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
		this.operation = props.operation;
		this.count = props.count;
		this.refs = props.refs;

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
