import { DoBaseFactory } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { DomainOperationReportBuilder, DomainDeletionReportBuilder } from '../../builder';
import { DeletionLog, DeletionLogProps } from '../../do';
import { DomainName, OperationType } from '../../types';

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
