import { ObjectId } from '@mikro-orm/mongodb';
import { MediaBoardColors, MediaBoardLayoutType } from '@modules/board/domain';
import {
	AnyMediaBoardDo,
	BoardExternalReferenceType,
	MediaBoard,
	type MediaBoardProps,
} from '@shared/domain/domainobject';
import { DeepPartial } from 'fishery';
import { BaseFactory } from '../../base.factory';

class MediaBoardFactory extends BaseFactory<MediaBoard, MediaBoardProps> {
	addChild(child: AnyMediaBoardDo): this {
		const params: DeepPartial<MediaBoardProps> = { children: [child] };

		return this.params(params);
	}
}

export const mediaBoardFactory = MediaBoardFactory.define(MediaBoard, () => {
	return {
		id: new ObjectId().toHexString(),
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		context: {
			type: BoardExternalReferenceType.User,
			id: new ObjectId().toHexString(),
		},
		layout: MediaBoardLayoutType.LIST,
		mediaAvailableLineCollapsed: false,
		mediaAvailableLineBackgroundColor: MediaBoardColors.TRANSPARENT,
	};
});
