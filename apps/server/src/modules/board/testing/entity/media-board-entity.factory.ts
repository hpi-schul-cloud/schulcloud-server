import { ObjectId } from '@mikro-orm/mongodb';
import {
	BoardExternalReferenceType,
	BoardLayout,
	BoardNodeType,
	MediaBoardColors,
	MediaBoardProps,
	ROOT_PATH,
} from '../../domain';
import { Context } from '../../repo/entity/embeddables';
import { BoardNodeEntityFactory, PropsWithType } from './board-node-entity.factory';

export const mediaBoardEntityFactory = BoardNodeEntityFactory.define<PropsWithType<MediaBoardProps>>(({ params }) => {
	const context =
		params.context && params.context.type && params.context.id
			? new Context({
					type: params.context.type,
					id: params.context.id,
			  })
			: new Context({
					type: BoardExternalReferenceType.Course,
					id: new ObjectId().toHexString(),
			  });

	const props: PropsWithType<MediaBoardProps> = {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		position: 0,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		context,
		backgroundColor: MediaBoardColors.TRANSPARENT,
		collapsed: false,
		layout: BoardLayout.LIST,
		type: BoardNodeType.MEDIA_BOARD,
	};

	return props;
});
