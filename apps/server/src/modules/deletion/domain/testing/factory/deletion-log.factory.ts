import { DoBaseFactory } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { DomainName, OperationType } from '@shared/domain/types';
import { DomainDeletionReportBuilder, DomainOperationReportBuilder } from '@shared/domain/builder';
import { DeletionLog, DeletionLogProps } from '../../deletion-log.do';

export const deletionLogFactory = DoBaseFactory.define<DeletionLog, DeletionLogProps>(DeletionLog, () => {
	return {
		id: new ObjectId().toHexString(),
		domain: DomainName.USER,
		operations: [DomainOperationReportBuilder.build(OperationType.DELETE, 1, [new ObjectId().toHexString()])],
		subdomainOperations: [
			DomainDeletionReportBuilder.build(DomainName.REGISTRATIONPIN, [
				DomainOperationReportBuilder.build(OperationType.DELETE, 2, [
					new ObjectId().toHexString(),
					new ObjectId().toHexString(),
				]),
			]),
		],
		deletionRequestId: new ObjectId().toHexString(),
		performedAt: new Date(),
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
