import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { DomainName, OperationType } from '@shared/domain/types';
import { DomainDeletionReportBuilder, DomainOperationReportBuilder } from '@shared/domain/builder';
import { DeletionLogEntity, DeletionLogEntityProps } from '../../deletion-log.entity';

export const deletionLogEntityFactory = BaseFactory.define<DeletionLogEntity, DeletionLogEntityProps>(
	DeletionLogEntity,
	() => {
		const id = new ObjectId();
		return {
			id: new ObjectId().toHexString(),
			domain: DomainName.USER,
			domainOperationReport: [
				DomainOperationReportBuilder.build(OperationType.DELETE, 1, [new ObjectId().toHexString()]),
			],
			domainDeletionReport: DomainDeletionReportBuilder.build(DomainName.REGISTRATIONPIN, [
				DomainOperationReportBuilder.build(OperationType.DELETE, 2, [
					new ObjectId().toHexString(),
					new ObjectId().toHexString(),
				]),
			]),
			performedAt: new Date(),
			deletionRequestId: id,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
