import { Entity, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { DomainDeletionReport, DomainOperationReport } from '@shared/domain/interface';
import { DomainName, EntityId } from '@shared/domain/types';
import { ObjectId } from 'bson';

export interface DeletionLogEntityProps {
	id?: EntityId;
	domain: DomainName;
	// domainOperationReport: DomainOperationReportProps[];
	domainOperationReport: DomainOperationReport[];
	domainDeletionReport?: DomainDeletionReport;
	deletionRequestId: ObjectId;
	performedAt?: Date;
	createdAt?: Date;
	updatedAt?: Date;
}

// export class DomainOperationReportProps {
// 	operation: OperationType;

// 	count: number;

// 	refs: EntityId[];

// 	constructor(props: DomainOperationReportProps) {
// 		this.operation = props.operation;
// 		this.count = props.count;
// 		this.refs = props.refs;
// 	}
// }

@Entity({ tableName: 'deletionlogs' })
export class DeletionLogEntity extends BaseEntityWithTimestamps {
	@Property()
	domain: DomainName;

	@Property()
	domainOperationReport: DomainOperationReport[];

	@Property({ nullable: true })
	domainDeletionReport?: DomainDeletionReport;

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
		this.domainOperationReport = props.domainOperationReport;
		this.deletionRequestId = props.deletionRequestId;

		if (props.domainDeletionReport !== undefined) {
			this.domainDeletionReport = props.domainDeletionReport;
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
