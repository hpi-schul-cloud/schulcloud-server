/* istanbul ignore file */
import { Card, CardProps } from '@shared/domain';
import { ObjectId } from 'bson';
import { BaseFactory } from '../../base.factory';

export const cardFactory = BaseFactory.define<Card, CardProps>(Card, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		title: `card #${sequence}`,
		height: 150,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});

cardFactory.build({ title: 'My Card' });
