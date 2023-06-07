import { InputFormat } from '@shared/domain';
import {
	cardFactory,
	columnBoardFactory,
	columnFactory,
	fileElementFactory,
	richTextElementFactory,
	taskElementFactory,
} from '@shared/testing';
import { FileContentBody, RichTextContentBody } from '../controller/dto';
import { ContentElementUpdateVisitor } from './content-element-update.visitor';

describe(ContentElementUpdateVisitor.name, () => {
	describe('when visiting an unsupported component', () => {
		const setup = () => {
			const board = columnBoardFactory.build();
			const column = columnFactory.build();
			const card = cardFactory.build();
			const content = new RichTextContentBody();
			content.text = 'a text';
			content.inputFormat = InputFormat.RICH_TEXT_CK5;
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

	describe('when visiting a file element using the wrong content', () => {
		const setup = () => {
			const fileElement = fileElementFactory.build();
			const content = new RichTextContentBody();
			content.text = 'a text';
			content.inputFormat = InputFormat.RICH_TEXT_CK5;
			const updater = new ContentElementUpdateVisitor(content);

			return { fileElement, updater };
		};

		it('should throw an error', () => {
			const { fileElement, updater } = setup();

			expect(() => updater.visitFileElement(fileElement)).toThrow();
		});
	});

	describe('when visiting a rich text element using the wrong content', () => {
		const setup = () => {
			const richTextElement = richTextElementFactory.build();
			const content = new FileContentBody();
			content.caption = 'a caption';
			const updater = new ContentElementUpdateVisitor(content);

			return { richTextElement, updater };
		};

		it('should throw an error', () => {
			const { richTextElement, updater } = setup();

			expect(() => updater.visitRichTextElement(richTextElement)).toThrow();
		});
	});

	describe('when visiting a task element using the wrong content', () => {
		const setup = () => {
			const taskElement = taskElementFactory.build();
			const content = new RichTextContentBody();
			content.text = 'a text';
			content.inputFormat = InputFormat.RICH_TEXT_CK5;
			const updater = new ContentElementUpdateVisitor(content);

			return { taskElement, updater };
		};

		it('should throw an error', () => {
			const { taskElement, updater } = setup();

			expect(() => updater.visitTaskElement(taskElement)).toThrow();
		});
	});
});
