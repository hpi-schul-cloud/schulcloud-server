/* istanbul ignore file */
import { Card, CardProps } from '@shared/domain/domainobject';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '../../base.factory';

export const cardFactory = BaseFactory.define<Card, CardProps>(Card, ({ sequence, params }) => {
	return {
		id: new ObjectId().toHexString(),
		title: `card #${sequence}`,
		height: 150,
		children: params?.children || [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
