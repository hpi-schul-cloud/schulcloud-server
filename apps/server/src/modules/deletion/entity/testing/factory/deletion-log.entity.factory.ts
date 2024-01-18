import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { DomainModel, OperationModel } from '@shared/domain/types';
import { DeletionLogEntity, DeletionLogEntityProps } from '../../deletion-log.entity';

export const deletionLogEntityFactory = BaseFactory.define<DeletionLogEntity, DeletionLogEntityProps>(
	DeletionLogEntity,
	() => {
		return {
			id: new ObjectId().toHexString(),
			domain: DomainModel.USER,
			operation: OperationModel.DELETE,
			count: 1,
			refs: [new ObjectId().toHexString()],
			deletionRequestId: new ObjectId(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
