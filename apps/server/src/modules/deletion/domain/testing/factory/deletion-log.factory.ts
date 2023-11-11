import { DoBaseFactory } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { DeletionLog, DeletionLogProps } from '../../deletion-log.do';
import { DeletionOperationModel } from '../../types/deletion-operation-model.enum';
import { DeletionDomainModel } from '../../types/deletion-domain-model.enum';

export const deletionLogFactory = DoBaseFactory.define<DeletionLog, DeletionLogProps>(DeletionLog, () => {
	return {
		id: new ObjectId().toHexString(),
		domain: DeletionDomainModel.USER,
		operation: DeletionOperationModel.DELETE,
		modifiedCount: 0,
		deletedCount: 1,
		deletionRequestId: new ObjectId().toHexString(),
		performedAt: new Date(),
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
