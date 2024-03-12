import { DoBaseFactory } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { DeepPartial } from 'fishery';
import { DomainOperationReportBuilder, DomainDeletionReportBuilder } from '../../../builder';
import { DomainName, OperationType } from '../../../types';
import { DeletionLog, DeletionLogProps } from '../../deletion-log.do';

class DeletionLogFactory extends DoBaseFactory<DeletionLog, DeletionLogProps> {
	withDeletionRequestId(id: string): this {
		const params: DeepPartial<DeletionLogProps> = {
			deletionRequestId: id,
		};

		return this.params(params);
	}
}

export const deletionLogFactory = DeletionLogFactory.define(DeletionLog, () => {
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
