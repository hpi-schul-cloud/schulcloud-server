import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeEntityFactory, PropsWithType } from './board-node-entity.factory';
import {
	BoardExternalReferenceType,
	BoardLayout,
	BoardNodeType,
	MediaBoardColors,
	MediaBoardProps,
	ROOT_PATH,
} from '../../domain';

export const mediaBoardEntityFactory = BoardNodeEntityFactory.define<PropsWithType<MediaBoardProps>>(() => {
	const props: PropsWithType<MediaBoardProps> = {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		position: 0,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		context: {
			type: BoardExternalReferenceType.Course,
			id: new ObjectId().toHexString(),
		},
		backgroundColor: MediaBoardColors.TRANSPARENT,
		collapsed: false,
		layout: BoardLayout.LIST,
		type: BoardNodeType.MEDIA_BOARD,
	};

	return props;
});
