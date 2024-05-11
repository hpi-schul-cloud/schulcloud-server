import { ObjectId } from '@mikro-orm/mongodb';
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import { BaseFactory } from '@shared/testing';
import { MediaBoard, MediaBoardProps, ROOT_PATH } from '../domain';

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
	};

	return props;
});
