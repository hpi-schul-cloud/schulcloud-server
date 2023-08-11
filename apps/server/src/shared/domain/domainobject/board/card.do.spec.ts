import { createMock } from '@golevelup/ts-jest';
import { cardFactory, richTextElementFactory, submissionContainerElementFactory } from '@shared/testing';
import { Card } from './card.do';
import { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

describe(Card.name, () => {
	describe('isAllowedAsChild', () => {
		it('should allow rich text element objects', () => {
			const card = cardFactory.build();
			const richTextElement = richTextElementFactory.build();
			expect(card.isAllowedAsChild(richTextElement)).toBe(true);
		});

		it('should allow submission container element objects', () => {
			const card = cardFactory.build();
			const submissionContainerElement = submissionContainerElementFactory.build();
			expect(card.isAllowedAsChild(submissionContainerElement)).toBe(true);
		});
	});

	describe('accept', () => {
		it('should call the right visitor method', () => {
			const visitor = createMock<BoardCompositeVisitor>();
			const card = cardFactory.build();

			card.accept(visitor);

			expect(visitor.visitCard).toHaveBeenCalledWith(card);
		});
	});

	describe('acceptAsync', () => {
		it('should call the right async visitor method', async () => {
			const visitor = createMock<BoardCompositeVisitorAsync>();
			const card = cardFactory.build();

			await card.acceptAsync(visitor);

			expect(visitor.visitCardAsync).toHaveBeenCalledWith(card);
		});
	});

	describe('set title', () => {
		it('should set the title property', () => {
			const card = cardFactory.build({ title: 'card #1' });
			card.title = 'card #2';
			expect(card.title).toEqual('card #2');
		});
	});

	describe('set height', () => {
		it('should set the height property', () => {
			const card = cardFactory.build({ height: 10 });
			card.height = 42;
			expect(card.height).toEqual(42);
		});
	});
});
