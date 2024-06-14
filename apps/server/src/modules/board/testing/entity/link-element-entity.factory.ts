import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeEntityFactory, PropsWithType } from './board-node-entity.factory';
import { BoardNodeType, LinkElementProps, ROOT_PATH } from '../../domain';

export const linkElementEntityFactory = BoardNodeEntityFactory.define<PropsWithType<LinkElementProps>>(
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			path: ROOT_PATH,
			level: 0,
			title: `link element #${sequence}`,
			position: 0,
			children: [],
			description: `description #${sequence}`,
			url: `url #${sequence}`,
			imageUrl: `image-url #${sequence}`,
			createdAt: new Date(),
			updatedAt: new Date(),
			type: BoardNodeType.LINK_ELEMENT,
		};
	}
);
