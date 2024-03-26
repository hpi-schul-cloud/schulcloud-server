import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { SynchronizationEntity, SynchronizationEntityProps } from '../../synchronization.entity';
import { SynchronizationStatusModel } from '../../../../domain/types';

export const synchronizationEntityFactory = BaseFactory.define<SynchronizationEntity, SynchronizationEntityProps>(
	SynchronizationEntity,
	() => {
		return {
			id: new ObjectId().toHexString(),
			count: 1,
			failureCause: '',
			status: SynchronizationStatusModel.REGISTERED,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
