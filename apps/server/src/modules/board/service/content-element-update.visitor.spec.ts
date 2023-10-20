import { ObjectId } from '@mikro-orm/mongodb';
import { InputFormat } from '@shared/domain';
import {
	cardFactory,
	columnBoardFactory,
	columnFactory,
	externalToolElementFactory,
	fileElementFactory,
	linkElementFactory,
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
			const content = new RichTextContentBody();
			content.text = 'a text';
			content.inputFormat = InputFormat.RICH_TEXT_CK5;
			const submissionItem = submissionItemFactory.build();
			const updater = new ContentElementUpdateVisitor(content);

			return { board, column, card, submissionItem, updater };
		};

		describe('when component is a column board', () => {
			it('should throw an error', async () => {
				const { board, updater } = setup();
				await expect(updater.visitColumnBoardAsync(board)).rejects.toThrow();
			});
		});

		describe('when component is a column', () => {
			it('should throw an error', async () => {
				const { column, updater } = setup();
				await expect(() => updater.visitColumnAsync(column)).rejects.toThrow();
			});
		});

		describe('when component is a card', () => {
			it('should throw an error', async () => {
				const { card, updater } = setup();
				await expect(() => updater.visitCardAsync(card)).rejects.toThrow();
			});
		});

		describe('when component is a submission-item', () => {
			it('should throw an error', async () => {
				const { submissionItem, updater } = setup();
				await expect(() => updater.visitSubmissionItemAsync(submissionItem)).rejects.toThrow();
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

		it('should throw an error', async () => {
			const { fileElement, updater } = setup();

			await expect(() => updater.visitFileElementAsync(fileElement)).rejects.toThrow();
		});
	});

	describe('when visiting a link element using the wrong content', () => {
		const setup = () => {
			const linkElement = linkElementFactory.build();
			const content = new FileContentBody();
			content.caption = 'a caption';
			const updater = new ContentElementUpdateVisitor(content);

			return { linkElement, updater };
		};

		it('should throw an error', async () => {
			const { linkElement, updater } = setup();

			await expect(() => updater.visitLinkElementAsync(linkElement)).rejects.toThrow();
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

		it('should throw an error', async () => {
			const { richTextElement, updater } = setup();

			await expect(() => updater.visitRichTextElementAsync(richTextElement)).rejects.toThrow();
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

		it('should throw an error', async () => {
			const { submissionContainerElement, updater } = setup();

			await expect(() => updater.visitSubmissionContainerElementAsync(submissionContainerElement)).rejects.toThrow();
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

			it('should update the content', async () => {
				const { externalToolElement, updater, content } = setup();

				await updater.visitExternalToolElementAsync(externalToolElement);

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

			it('should throw an error', async () => {
				const { externalToolElement, updater } = setup();

				await expect(() => updater.visitExternalToolElementAsync(externalToolElement)).rejects.toThrow();
			});
		});

		describe('when visiting a external tool element without setting a contextExternalId', () => {
			const setup = () => {
				const externalToolElement = externalToolElementFactory.build();
				const content = new ExternalToolContentBody();
				const updater = new ContentElementUpdateVisitor(content);

				return { externalToolElement, updater };
			};

			it('should throw an error', async () => {
				const { externalToolElement, updater } = setup();

				await expect(() => updater.visitExternalToolElementAsync(externalToolElement)).rejects.toThrow();
			});
		});
	});
});
