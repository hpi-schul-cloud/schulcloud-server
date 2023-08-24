import { createMock } from '@golevelup/ts-jest';
import { drawingElementFactory } from '@shared/testing/factory/domainobject/board/drawing-element.do.factory';
import { DrawingElement } from '@shared/domain/domainobject/board/drawing-element.do';
import { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

describe(DrawingElement.name, () => {
	describe('when trying to add a child to a drawing element', () => {
		it('should throw an error ', () => {
			const drawingElement = drawingElementFactory.build();
			const drawingElementChild = drawingElementFactory.build();

			expect(() => drawingElement.addChild(drawingElementChild)).toThrow();
		});
	});

	describe('accept', () => {
		it('should call the right visitor method', () => {
			const visitor = createMock<BoardCompositeVisitor>();
			const drawingElement = drawingElementFactory.build();

			drawingElement.accept(visitor);

			expect(visitor.visitRichTextElement).toHaveBeenCalledWith(drawingElement);
		});
	});

	describe('acceptAsync', () => {
		it('should call the right async visitor method', async () => {
			const visitor = createMock<BoardCompositeVisitorAsync>();
			const drawingElement = drawingElementFactory.build();

			await drawingElement.acceptAsync(visitor);

			expect(visitor.visitRichTextElementAsync).toHaveBeenCalledWith(drawingElement);
		});
	});
});
