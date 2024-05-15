import { createMock } from '@golevelup/ts-jest';
import { linkElementFactory } from '@shared/testing/factory';
import { LinkElement } from './link-element.do';
import { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

describe(LinkElement.name, () => {
	describe('when trying to add a child to a link element', () => {
		it('should throw an error ', () => {
			const linkElement = linkElementFactory.build();
			const linkElementFactoryChild = linkElementFactory.build();

			expect(() => linkElement.addChild(linkElementFactoryChild)).toThrow();
		});
	});

	describe('accept', () => {
		it('should call the right visitor method', () => {
			const visitor = createMock<BoardCompositeVisitor>();
			const linkElement = linkElementFactory.build();

			linkElement.accept(visitor);

			expect(visitor.visitLinkElement).toHaveBeenCalledWith(linkElement);
		});
	});

	describe('acceptAsync', () => {
		it('should call the right async visitor method', async () => {
			const visitor = createMock<BoardCompositeVisitorAsync>();
			const linkElement = linkElementFactory.build();

			await linkElement.acceptAsync(visitor);

			expect(visitor.visitLinkElementAsync).toHaveBeenCalledWith(linkElement);
		});
	});
});
