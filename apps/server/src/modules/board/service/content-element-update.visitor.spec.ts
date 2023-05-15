import {
	cardFactory,
	columnBoardFactory,
	columnFactory,
	fileElementFactory,
	textElementFactory,
} from '@shared/testing';
import { ContentElementUpdateVisitor } from './content-element-update.visitor';
import { FileContentBody, TextContentBody } from '../controller/dto';

describe(ContentElementUpdateVisitor.name, () => {
	describe('when visiting an unsupported component', () => {
		const setup = () => {
			const board = columnBoardFactory.build();
			const column = columnFactory.build();
			const card = cardFactory.build();
			const content = new TextContentBody();
			content.text = 'a text';
			const updater = new ContentElementUpdateVisitor(content);

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

	describe('when visiting a text element using the wrong content', () => {
		const setup = () => {
			const textElement = textElementFactory.build();
			const content = new FileContentBody();
			content.caption = 'a caption';
			const updater = new ContentElementUpdateVisitor(content);

			return { textElement, updater };
		};

		it('should throw an error', () => {
			const { textElement, updater } = setup();

			expect(() => updater.visitTextElement(textElement)).toThrow();
		});
	});

	describe('when visiting a file element using the wrong content', () => {
		const setup = () => {
			const fileElement = fileElementFactory.build();
			const content = new TextContentBody();
			content.text = 'a text';
			const updater = new ContentElementUpdateVisitor(content);

			return { fileElement, updater };
		};

		it('should throw an error', () => {
			const { fileElement, updater } = setup();

			expect(() => updater.visitFileElement(fileElement)).toThrow();
		});
	});
});
