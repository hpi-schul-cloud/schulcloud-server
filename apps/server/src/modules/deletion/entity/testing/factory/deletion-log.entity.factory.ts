import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { DomainModel } from '@shared/domain/types';
import { DeletionLogEntity, DeletionLogEntityProps } from '../../deletion-log.entity';
import { DeletionOperationModel } from '../../../domain/types';

export const deletionLogEntityFactory = BaseFactory.define<DeletionLogEntity, DeletionLogEntityProps>(
	DeletionLogEntity,
	() => {
		return {
			id: new ObjectId().toHexString(),
			domain: DomainModel.USER,
			operation: DeletionOperationModel.DELETE,
			modifiedCount: 0,
			deletedCount: 1,
			deletionRequestId: new ObjectId(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
