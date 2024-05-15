import { mediaExternalToolElementFactory } from '@shared/testing/factory';
import { MediaExternalToolElement } from './media-external-tool-element.do';

describe(MediaExternalToolElement.name, () => {
	describe('when trying to add a child to a media external tool element', () => {
		it('should throw an error ', () => {
			const externalToolElement = mediaExternalToolElementFactory.build();
			const externalToolElementChild = mediaExternalToolElementFactory.build();

			expect(() => externalToolElement.addChild(externalToolElementChild)).toThrow();
		});
	});
});
