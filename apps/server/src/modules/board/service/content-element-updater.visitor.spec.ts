import { cardFactory, columnBoardFactory, columnFactory } from '@shared/testing';
import { ContentElementUpdaterVisitor } from './content-element-updater.visitor';

describe(ContentElementUpdaterVisitor.name, () => {
	describe('when visiting an unsupported component', () => {
		const setup = () => {
			const board = columnBoardFactory.build();
			const column = columnFactory.build();
			const card = cardFactory.build();
			const updater = new ContentElementUpdaterVisitor({ text: 'a text' });

			return { board, column, card, updater };
		};

		describe('when component is a column board', () => {
			it('should throw an error', () => {
				const { board, updater } = setup();
				expect(() => updater.visitColumnBoard(board)).toThrow();
			});
		});

		describe('when component is a column', () => {
			it('should throw an error', () => {
				const { column, updater } = setup();
				expect(() => updater.visitColumn(column)).toThrow();
			});
		});

		describe('when component is a card', () => {
			it('should throw an error', () => {
				const { card, updater } = setup();
				expect(() => updater.visitCard(card)).toThrow();
			});
		});
	});
});
