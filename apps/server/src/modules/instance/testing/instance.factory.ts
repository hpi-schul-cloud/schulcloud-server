import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { Instance, InstanceProps } from '../domain';

export const instanceFactory = BaseFactory.define<Instance, InstanceProps>(Instance, () => {
	return {
		id: new ObjectId().toHexString(),
		name: 'dbc',
	};
});
