import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeType, FileFolderElementProps, ROOT_PATH } from '../domain';
import { BoardNodeEntityFactory, PropsWithType } from './entity/board-node-entity.factory';

export const fileFolderElementFactory = BoardNodeEntityFactory.define<PropsWithType<FileFolderElementProps>>(
	({ sequence }) => {
		const props: PropsWithType<FileFolderElementProps> = {
			id: new ObjectId().toHexString(),
			path: ROOT_PATH,
			level: 0,
			position: 0,
			children: [],
			title: `title #${sequence}`,
			createdAt: new Date(),
			updatedAt: new Date(),
			type: BoardNodeType.FILE_FOLDER_ELEMENT,
		};

		return props;
	}
);
