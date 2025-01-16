import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { SynchronizationStatusModel } from '../../../../domain/types';
import { SynchronizationEntity, SynchronizationEntityProps } from '../../synchronization.entity';

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
