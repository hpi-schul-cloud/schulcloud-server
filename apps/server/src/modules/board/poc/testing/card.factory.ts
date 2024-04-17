/* istanbul ignore file */
import { BoardNodeType } from '@shared/domain/entity';
import { BaseFactory } from '@shared/testing';
import { ObjectId } from 'bson';
import { Card, CardProps } from '../domain';
import { ROOT_PATH } from '../domain/path-utils';

export const cardFactory = BaseFactory.define<Card, CardProps>(Card, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		type: BoardNodeType.CARD,
		path: ROOT_PATH,
		level: 0,
		title: `card #${sequence}`,
		position: 0,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		height: 42,
	};
});
