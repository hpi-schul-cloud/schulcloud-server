import { MediaExternalToolElement, isMediaExternalToolElement } from './media-external-tool-element.do';
import { BoardNodeProps } from '../types';

describe('MediaExternalToolElement', () => {
	let mediaExternalToolElement: MediaExternalToolElement;

	const boardNodeProps: BoardNodeProps = {
		id: '1',
		path: '',
		level: 1,
		position: 1,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(() => {
		mediaExternalToolElement = new MediaExternalToolElement({
			...boardNodeProps,
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
