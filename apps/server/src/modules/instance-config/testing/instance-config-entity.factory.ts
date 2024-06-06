import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { InstanceConfigEntity, InstanceConfigEntityProps } from '../entity';

export const instanceConfigEntityFactory = BaseFactory.define<InstanceConfigEntity, InstanceConfigEntityProps>(
	InstanceConfigEntity,
	() => {
		return {
			id: new ObjectId().toHexString(),
			name: 'dbc',
		};
	}
);
