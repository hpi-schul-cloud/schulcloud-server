import { ObjectId } from '@mikro-orm/mongodb';
import { MediaBoardLayoutType } from '@modules/board/controller/media-board/types/layout-type.enum';
import { MediaBoardColors } from '@modules/board/controller/media-board/types/media-colors.enum';
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import { MediaBoardNode } from '@shared/domain/entity';
import { MediaBoardNodeProps } from '../../../domain/entity/boardnode/media-board/media-board-node.entity';
import { BaseFactory } from '../base.factory';

export const mediaBoardNodeFactory = BaseFactory.define<MediaBoardNode, MediaBoardNodeProps>(MediaBoardNode, () => {
	return {
		context: {
			type: BoardExternalReferenceType.User,
			id: new ObjectId().toHexString(),
		},
		mediaAvailableLineBackgroundColor: MediaBoardColors.TRANSPARENT,
		mediaAvailableLineCollapsed: false,
		layout: MediaBoardLayoutType.LIST,
	};
});
