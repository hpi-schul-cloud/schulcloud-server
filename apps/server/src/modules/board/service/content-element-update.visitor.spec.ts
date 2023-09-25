import { ObjectId } from '@mikro-orm/mongodb';
import { InputFormat } from '@shared/domain';
import {
	cardFactory,
	columnBoardFactory,
	columnFactory,
	externalToolElementFactory,
	drawingElementFactory,
	fileElementFactory,
	richTextElementFactory,
	submissionContainerElementFactory,
	submissionItemFactory,
} from '@shared/testing';
import { ExternalToolContentBody, FileContentBody, RichTextContentBody } from '../controller/dto';
import { ContentElementUpdateVisitor } from './content-element-update.visitor';

describe(ContentElementUpdateVisitor.name, () => {
	describe('when visiting an unsupported component', () => {
		const setup = () => {
			const board = columnBoardFactory.build();
			const column = columnFactory.build();
			const card = cardFactory.build();
			const drawingItem = drawingElementFactory.build();
			const content = new RichTextContentBody();
			content.text = 'a text';
			content.inputFormat = InputFormat.RICH_TEXT_CK5;
			const submissionItem = submissionItemFactory.build();
			const updater = new ContentElementUpdateVisitor(content);

			return { board, column, card, submissionItem, drawingItem, updater };
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

		describe('when component is a submission-item', () => {
			it('should throw an error', () => {
				const { submissionItem, updater } = setup();
				expect(() => updater.visitSubmissionItem(submissionItem)).toThrow();
			});
		});

		describe('when component is a drawing-item', () => {
			it('should throw an error', () => {
				const { drawingItem, updater } = setup();
				expect(() => updater.visitDrawingElement(drawingItem)).toThrow();
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

	describe('when visiting a submission container element using the wrong content', () => {
		const setup = () => {
			const submissionContainerElement = submissionContainerElementFactory.build();
			const content = new RichTextContentBody();
			content.text = 'a text';
			content.inputFormat = InputFormat.RICH_TEXT_CK5;
			const updater = new ContentElementUpdateVisitor(content);

			return { submissionContainerElement, updater };
		};

		it('should throw an error', () => {
			const { submissionContainerElement, updater } = setup();

			expect(() => updater.visitSubmissionContainerElement(submissionContainerElement)).toThrow();
		});
	});

	describe('when visiting a external tool element', () => {
		describe('when visiting a external tool element with valid content', () => {
			const setup = () => {
				const externalToolElement = externalToolElementFactory.build({ contextExternalToolId: undefined });
				const content = new ExternalToolContentBody();
				content.contextExternalToolId = new ObjectId().toHexString();
				const updater = new ContentElementUpdateVisitor(content);

				return { externalToolElement, updater, content };
			};

			it('should update the content', () => {
				const { externalToolElement, updater, content } = setup();

				updater.visitExternalToolElement(externalToolElement);

				expect(externalToolElement.contextExternalToolId).toEqual(content.contextExternalToolId);
			});
		});

		describe('when visiting a external tool element using the wrong content', () => {
			const setup = () => {
				const externalToolElement = externalToolElementFactory.build();
				const content = new RichTextContentBody();
				content.text = 'a text';
				content.inputFormat = InputFormat.RICH_TEXT_CK5;
				const updater = new ContentElementUpdateVisitor(content);

				return { externalToolElement, updater };
			};

			it('should throw an error', () => {
				const { externalToolElement, updater } = setup();

				expect(() => updater.visitExternalToolElement(externalToolElement)).toThrow();
			});
		});

		describe('when visiting a external tool element without setting a contextExternalId', () => {
			const setup = () => {
				const externalToolElement = externalToolElementFactory.build();
				const content = new ExternalToolContentBody();
				const updater = new ContentElementUpdateVisitor(content);

				return { externalToolElement, updater };
			};

			it('should throw an error', () => {
				const { externalToolElement, updater } = setup();

				expect(() => updater.visitExternalToolElement(externalToolElement)).toThrow();
			});
		});
	});
});
