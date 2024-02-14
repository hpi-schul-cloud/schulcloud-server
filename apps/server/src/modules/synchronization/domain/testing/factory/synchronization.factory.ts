import { DoBaseFactory } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { Synchronization, SynchronizationProps } from '../../synchronization.do';

export const synchronizationFactory = DoBaseFactory.define<Synchronization, SynchronizationProps>(
	Synchronization,
	() => {
		return {
			id: new ObjectId().toHexString(),
			count: 1,
			failure: '',
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
