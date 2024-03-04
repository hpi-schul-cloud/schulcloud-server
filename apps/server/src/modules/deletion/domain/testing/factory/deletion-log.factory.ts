import { DoBaseFactory } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { DomainName, OperationType } from '@shared/domain/types';
import { DomainOperationReportBuilder } from '@shared/domain/builder';
import { DeletionLog, DeletionLogProps } from '../../deletion-log.do';

export const deletionLogFactory = DoBaseFactory.define<DeletionLog, DeletionLogProps>(DeletionLog, () => {
	const id = new ObjectId().toHexString();
	return {
		id: new ObjectId().toHexString(),
		domain: DomainName.USER,
		domainOperationReport: [
			DomainOperationReportBuilder.build(OperationType.DELETE, 1, [new ObjectId().toHexString()]),
		],
		domainDeletionReport: new DeletionLog({
			id: new ObjectId().toHexString(),
			domain: DomainName.REGISTRATIONPIN,
			domainOperationReport: [
				DomainOperationReportBuilder.build(OperationType.DELETE, 2, [
					new ObjectId().toHexString(),
					new ObjectId().toHexString(),
				]),
			],
			deletionRequestId: id,
			performedAt: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
		}),
		deletionRequestId: id,
		performedAt: new Date(),
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
