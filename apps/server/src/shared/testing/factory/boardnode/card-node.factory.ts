import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeType, CardNode, CardNodeProps } from '@shared/domain';
import { BaseFactory } from '../base.factory';

export const cardNodeFactory = BaseFactory.define<CardNode, CardNodeProps>(CardNode, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		type: BoardNodeType.CARD,
		height: 150,
		title: `card #${sequence}`,
	};
});
