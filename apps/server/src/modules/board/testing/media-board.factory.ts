import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import {
	BoardExternalReferenceType,
	BoardLayout,
	MediaBoard,
	MediaBoardColors,
	MediaBoardProps,
	ROOT_PATH,
} from '../domain';

export const mediaBoardFactory = BaseFactory.define<MediaBoard, MediaBoardProps>(MediaBoard, () => {
	const props: MediaBoardProps = {
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
	};

	return props;
});
