import { ObjectId } from '@mikro-orm/mongodb';
import { DoBaseFactory } from '@testing/factory/domainobject';
import { Synchronization, SynchronizationProps } from '../../do';
import { SynchronizationStatusModel } from '../../types';

export const synchronizationFactory = DoBaseFactory.define<Synchronization, SynchronizationProps>(
	Synchronization,
	() => {
		return {
			id: new ObjectId().toHexString(),
			systemId: new ObjectId().toHexString(),
			count: 1,
			failureCause: '',
			status: SynchronizationStatusModel.REGISTERED,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
