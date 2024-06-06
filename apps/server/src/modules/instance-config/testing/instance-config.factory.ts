import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { InstanceConfig, InstanceConfigProps } from '../domain';

export const instanceConfigFactory = BaseFactory.define<InstanceConfig, InstanceConfigProps>(InstanceConfig, () => {
	return {
		id: new ObjectId().toHexString(),
		name: 'dbc',
	};
});
