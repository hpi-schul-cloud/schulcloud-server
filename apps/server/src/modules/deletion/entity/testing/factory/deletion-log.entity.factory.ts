import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { DomainDeletionReportBuilder } from '@src/modules/deletion/builder/domain-deletion-report.builder';
import { DomainOperationReportBuilder } from '@src/modules/deletion/builder/domain-operation-report.builder';
import { DomainName } from '@src/modules/deletion/types/domain-name.enum';
import { OperationType } from '@src/modules/deletion/types/operation-type.enum';
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
