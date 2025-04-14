import { drawingElementFactory } from '../testing';
import { DrawingElement, isDrawingElement } from './drawing-element.do';

describe('DrawingElement', () => {
	let drawingElement: DrawingElement;

	beforeEach(() => {
		drawingElement = drawingElementFactory.build({
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
