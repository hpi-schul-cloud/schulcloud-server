import { DrawingElement, isDrawingElement } from './drawing-element.do';
import { BoardNodeProps } from './types';

describe('DrawingElement', () => {
	let drawingElement: DrawingElement;

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
		drawingElement = new DrawingElement({
			...boardNodeProps,
			description: 'Test description',
		});
	});

	it('should be instance of DrawingElement', () => {
		expect(isDrawingElement(drawingElement)).toBe(true);
	});

	it('should not be instance of DrawingElement', () => {
		expect(isDrawingElement({})).toBe(false);
	});

	it('should return description', () => {
		expect(drawingElement.description).toBe('Test description');
	});

	it('should set description', () => {
		drawingElement.description = 'New description';
		expect(drawingElement.description).toBe('New description');
	});

	it('should not have child', () => {
		expect(drawingElement.canHaveChild()).toBe(false);
	});
});
