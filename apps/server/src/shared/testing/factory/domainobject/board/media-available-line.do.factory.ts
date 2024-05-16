import { MediaBoardColors } from '@modules/board/controller/media-board/types/media-colors.enum';
import { MediaAvailableLine, MediaAvailableLineElement, MediaAvailableLineProps } from '@shared/domain/domainobject';
import { DeepPartial } from 'fishery';
import { BaseFactory } from '../../base.factory';

class MediaAvailableLineFactory extends BaseFactory<MediaAvailableLine, MediaAvailableLineProps> {
	withElement(element: MediaAvailableLineElement): this {
		const params: DeepPartial<MediaAvailableLineProps> = { elements: [element] };

		return this.params(params);
	}
}

export const mediaAvailableLineFactory = MediaAvailableLineFactory.define(MediaAvailableLine, () => {
	return {
		elements: [],
		backgroundColor: MediaBoardColors.TRANSPARENT,
		collapsed: false,
	};
});
