/* istanbul ignore file */
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeType, CardProps, ROOT_PATH } from '../../domain';
import { BoardNodeEntityFactory, PropsWithType } from './board-node-entity.factory';

export const cardFactory = BoardNodeEntityFactory.define<PropsWithType<CardProps>>(({ sequence }) => {
	const props: PropsWithType<CardProps> = {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		title: `card #${sequence}`,
		position: 0,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		height: 42,
		type: BoardNodeType.CARD,
	};

	return props;
});
