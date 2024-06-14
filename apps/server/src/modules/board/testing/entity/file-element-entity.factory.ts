import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeType, FileElementProps, ROOT_PATH } from '../../domain';
import { BoardNodeEntityFactory, PropsWithType } from './board-node-entity.factory';

export const fileElementEntityFactory = BoardNodeEntityFactory.define<PropsWithType<FileElementProps>>(
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			path: ROOT_PATH,
			level: 0,
			position: 0,
			children: [],
			caption: `file #${sequence}`,
			alternativeText: `alternative-text #${sequence}`,
			createdAt: new Date(),
			updatedAt: new Date(),
			type: BoardNodeType.FILE_ELEMENT,
		};
	}
);
