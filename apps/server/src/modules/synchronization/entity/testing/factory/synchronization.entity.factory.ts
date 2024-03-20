import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { StatusModel } from '@modules/deletion';
import { SynchronizationEntity, SynchronizationEntityProps } from '../../synchronization.entity';

export const synchronizationEntityFactory = BaseFactory.define<SynchronizationEntity, SynchronizationEntityProps>(
	SynchronizationEntity,
	() => {
		return {
			id: new ObjectId().toHexString(),
			count: 1,
			failureCause: '',
			status: StatusModel.PENDING,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
