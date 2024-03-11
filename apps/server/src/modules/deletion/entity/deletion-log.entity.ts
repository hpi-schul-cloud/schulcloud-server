import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { ObjectId } from 'bson';
import { Entity, Property, Index } from '@mikro-orm/core';
import { DomainOperationReport, DomainDeletionReport } from '../interface';
import { DomainName } from '../types';

export interface DeletionLogEntityProps {
	id?: EntityId;
	domain: DomainName;
	operations: DomainOperationReport[];
	subdomainOperations?: DomainDeletionReport[];
	deletionRequestId: ObjectId;
	performedAt?: Date;
	createdAt?: Date;
	updatedAt?: Date;
}

@Entity({ tableName: 'deletionlogs' })
export class DeletionLogEntity extends BaseEntityWithTimestamps {
	@Property()
	domain: DomainName;

	@Property()
	operations: DomainOperationReport[];

	@Property({ nullable: true })
	subdomainOperations?: DomainDeletionReport[];

	@Property()
	deletionRequestId: ObjectId;

	@Property({ nullable: true })
	@Index({ options: { expireAfterSeconds: 7776000 } })
	performedAt?: Date;

	constructor(props: DeletionLogEntityProps) {
		super();
		if (props.id !== undefined) {
			this.id = props.id;
		}

		this.domain = props.domain;
		this.operations = props.operations;
		this.deletionRequestId = props.deletionRequestId;

		if (props.subdomainOperations !== undefined) {
			this.subdomainOperations = props.subdomainOperations;
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
