import { mediaExternalToolElementFactory } from '../../testing';
import { MediaExternalToolElement, isMediaExternalToolElement } from './media-external-tool-element.do';

describe('MediaExternalToolElement', () => {
	let mediaExternalToolElement: MediaExternalToolElement;

	beforeEach(() => {
		mediaExternalToolElement = mediaExternalToolElementFactory.build({
			contextExternalToolId: 'test-id',
		});
	});

	it('should be instance of MediaExternalToolElement', () => {
		expect(isMediaExternalToolElement(mediaExternalToolElement)).toBe(true);
	});

	it('should not be instance of MediaExternalToolElement', () => {
		expect(isMediaExternalToolElement({})).toBe(false);
	});

	it('should return contextExternalToolId', () => {
		expect(mediaExternalToolElement.contextExternalToolId).toBe('test-id');
	});

	it('should not have child', () => {
		expect(mediaExternalToolElement.canHaveChild()).toBe(false);
	});
});
