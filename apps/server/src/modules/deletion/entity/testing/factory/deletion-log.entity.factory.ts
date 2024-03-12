import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { DomainOperationReportBuilder, DomainDeletionReportBuilder } from '../../../builder';
import { DomainName, OperationType } from '../../../types';
import { DeletionLogEntity, DeletionLogEntityProps } from '../../deletion-log.entity';

export const deletionLogEntityFactory = BaseFactory.define<DeletionLogEntity, DeletionLogEntityProps>(
	DeletionLogEntity,
	() => {
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
			performedAt: new Date(),
			deletionRequestId: new ObjectId(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
