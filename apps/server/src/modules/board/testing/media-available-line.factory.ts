import { BaseFactory } from '@testing/factory/base.factory';
import { DeepPartial } from 'fishery';
import { MediaAvailableLine, MediaAvailableLineElement, MediaAvailableLineProps, MediaBoardColors } from '../domain';

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
