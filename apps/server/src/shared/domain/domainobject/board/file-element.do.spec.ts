import { createMock } from '@golevelup/ts-jest';
import { fileElementFactory } from '@shared/testing';
import { FileElement } from './file-element.do';
import { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

describe(FileElement.name, () => {
	describe('when trying to add a child to a file element', () => {
		it('should throw an error ', () => {
			const fileElement = fileElementFactory.build();
			const fileElementChild = fileElementFactory.build();

			expect(() => fileElement.addChild(fileElementChild)).toThrow();
		});
	});

	describe('accept', () => {
		it('should call the right visitor method', () => {
			const visitor = createMock<BoardCompositeVisitor>();
			const fileElement = fileElementFactory.build();

			fileElement.accept(visitor);

			expect(visitor.visitFileElement).toHaveBeenCalledWith(fileElement);
		});
	});

	describe('acceptAsync', () => {
		it('should call the right async visitor method', async () => {
			const visitor = createMock<BoardCompositeVisitorAsync>();
			const fileElement = fileElementFactory.build();

			await fileElement.acceptAsync(visitor);

			expect(visitor.visitFileElementAsync).toHaveBeenCalledWith(fileElement);
		});
	});
});
