import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { DeletionRequestEntity, DeletionRequestEntityProps } from '../..';

export const deletionRequestEntityFactory = BaseFactory.define<DeletionRequestEntity, DeletionRequestEntityProps>(
	DeletionRequestEntity,
	() => {
		return {
			source: 'shd',
			deleteAfter: new Date(),
			userId: new ObjectId(),
		};
	}
);
