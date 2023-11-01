import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { DeletionLogEntity, DeletionLogEntityProps } from '@src/modules/deletion/entity';
import { DeletionOperationModel } from '@src/modules/deletion/domain/types/deletion-operation-model.enum';
import { DeletionDomainModel } from '@src/modules/deletion/domain/types/deletion-domain-model.enum';

export const deletionLogEntityFactory = BaseFactory.define<DeletionLogEntity, DeletionLogEntityProps>(
	DeletionLogEntity,
	() => {
		return {
			id: new ObjectId().toHexString(),
			domain: DeletionDomainModel.USER,
			operation: DeletionOperationModel.DELETE,
			modifiedCount: 0,
			deletedCount: 1,
			deletionRequestId: new ObjectId(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
