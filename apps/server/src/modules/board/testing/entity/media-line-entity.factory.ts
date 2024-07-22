import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeType, MediaBoardColors, MediaLineProps, ROOT_PATH } from '../../domain';
import { BoardNodeEntityFactory, PropsWithType } from './board-node-entity.factory';

export const mediaLineEntityFactory = BoardNodeEntityFactory.define<PropsWithType<MediaLineProps>>(({ sequence }) => {
	const props: PropsWithType<MediaLineProps> = {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		title: `Media-Line #${sequence}`,
		position: 0,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		backgroundColor: MediaBoardColors.TRANSPARENT,
		collapsed: false,
		type: BoardNodeType.MEDIA_LINE,
	};

	return props;
});
