import { DeepPartial } from 'fishery';
import { BaseFactory } from '@shared/testing';
import { MediaBoardColors, MediaAvailableLine, MediaAvailableLineElement, MediaAvailableLineProps } from '../domain';

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
