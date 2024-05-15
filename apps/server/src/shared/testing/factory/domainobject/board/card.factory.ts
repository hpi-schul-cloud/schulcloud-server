/* istanbul ignore file */
import { ObjectId } from '@mikro-orm/mongodb';
import { Card, CardProps, ROOT_PATH } from '@modules/board/domain';
import { BaseFactory } from '../../base.factory';

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
