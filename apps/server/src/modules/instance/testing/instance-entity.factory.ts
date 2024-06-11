import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { InstanceEntity, InstanceEntityProps } from '../entity';

export const instanceEntityFactory = BaseFactory.define<InstanceEntity, InstanceEntityProps>(InstanceEntity, () => {
	return {
		id: new ObjectId().toHexString(),
		name: 'dbc',
	};
});
