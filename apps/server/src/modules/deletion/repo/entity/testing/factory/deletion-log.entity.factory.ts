import { DomainDeletionReportBuilder, DomainOperationReportBuilder } from '@modules/deletion/domain/builder';
import { DomainName, OperationType } from '@modules/deletion/domain/types';
import { BaseFactory } from '@testing/factory/base.factory';
import { ObjectId } from '@mikro-orm/mongodb';
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
