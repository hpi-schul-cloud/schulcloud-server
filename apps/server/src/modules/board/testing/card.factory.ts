/* istanbul ignore file */
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { Card, CardProps, ROOT_PATH } from '../domain';

export const cardFactory = BaseFactory.define<Card, CardProps>(Card, ({ sequence }) => {
	const props: CardProps = {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		title: `card #${sequence}`,
		position: 0,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		height: 42,
	};

	return props;
});
