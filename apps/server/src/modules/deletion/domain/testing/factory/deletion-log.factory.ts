import { DoBaseFactory } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { DomainModel } from '@shared/domain/types';
import { DeletionLog, DeletionLogProps } from '../../deletion-log.do';
import { DeletionOperationModel } from '../../types';

export const deletionLogFactory = DoBaseFactory.define<DeletionLog, DeletionLogProps>(DeletionLog, () => {
	return {
		id: new ObjectId().toHexString(),
		domain: DomainModel.USER,
		operation: DeletionOperationModel.DELETE,
		count: 1,
		refs: [new ObjectId().toHexString()],
		deletionRequestId: new ObjectId().toHexString(),
		performedAt: new Date(),
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
