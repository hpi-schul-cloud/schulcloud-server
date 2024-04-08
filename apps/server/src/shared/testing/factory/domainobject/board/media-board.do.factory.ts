import { ObjectId } from '@mikro-orm/mongodb';
import { BoardExternalReferenceType, MediaBoard, type MediaBoardProps } from '@shared/domain/domainobject';
import { BaseFactory } from '../../base.factory';

export const mediaBoardFactory = BaseFactory.define<MediaBoard, MediaBoardProps>(MediaBoard, () => {
	return {
		id: new ObjectId().toHexString(),
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		context: {
			type: BoardExternalReferenceType.User,
			id: new ObjectId().toHexString(),
		},
	};
});
