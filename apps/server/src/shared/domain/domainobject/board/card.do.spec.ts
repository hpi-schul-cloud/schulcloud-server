import { createMock } from '@golevelup/ts-jest';
import { cardFactory, richTextElementFactory, taskElementFactory } from '@shared/testing';
import { Card } from './card.do';
import { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

describe(Card.name, () => {
	describe('isAllowedAsChild', () => {
		it('should allow rich text element objects', () => {
			const card = cardFactory.build();
			const richTextElement = richTextElementFactory.build();
			expect(card.isAllowedAsChild(richTextElement)).toBe(true);
		});

		it('should allow task element objects', () => {
			const card = cardFactory.build();
			const taskElement = taskElementFactory.build();
			expect(card.isAllowedAsChild(taskElement)).toBe(true);
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
});
