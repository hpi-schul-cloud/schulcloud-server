import { ObjectId } from '@mikro-orm/mongodb';
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import { MediaBoardNode, type RootBoardNodeProps } from '@shared/domain/entity';
import { BaseFactory } from '../base.factory';

export const mediaBoardNodeFactory = BaseFactory.define<MediaBoardNode, RootBoardNodeProps>(MediaBoardNode, () => {
	return {
		context: {
			type: BoardExternalReferenceType.User,
			id: new ObjectId().toHexString(),
		},
	};
});
