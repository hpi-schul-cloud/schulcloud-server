import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { ObjectId } from 'bson';
import { Entity, Property, Index, Unique } from '@mikro-orm/core';
import { DomainOperationReport, DomainDeletionReport } from '../../domain/interface';
import { DomainName } from '../../domain/types';

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
@Unique({ properties: ['domain', 'deletionRequestId'] }) // TODO check if this is correct, if we want to try to delete multiple times, it should not create a new log entry, but update it. Or first remove it
export class DeletionLogEntity extends BaseEntityWithTimestamps {
	@Property()
	@Index()
	domain: DomainName;

	@Property()
	operations: DomainOperationReport[];

	@Property({ nullable: true })
	subdomainOperations?: DomainDeletionReport[];

	@Property()
	@Index()
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
