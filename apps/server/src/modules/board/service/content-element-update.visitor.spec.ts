import { ObjectId } from '@mikro-orm/mongodb';
import { InputFormat } from '@shared/domain/types';
import {
	cardFactory,
	columnBoardFactory,
	columnFactory,
	drawingElementFactory,
	externalToolElementFactory,
	fileElementFactory,
	linkElementFactory,
	mediaBoardFactory,
	mediaExternalToolElementFactory,
	mediaLineFactory,
	richTextElementFactory,
	submissionContainerElementFactory,
	submissionItemFactory,
} from '@shared/testing';
import { ExternalToolContentBody, FileContentBody, LinkContentBody, RichTextContentBody } from '../controller/dto';
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

		describe('when component is a media board', () => {
			it('should throw an error', async () => {
				const { updater } = setup();
				const board = mediaBoardFactory.build();

				await expect(updater.visitMediaBoardAsync(board)).rejects.toThrow();
			});
		});

		describe('when component is a media line', () => {
			it('should throw an error', async () => {
				const { updater } = setup();
				const line = mediaLineFactory.build();

				await expect(() => updater.visitMediaLineAsync(line)).rejects.toThrow();
			});
		});

		describe('when component is a media external tool element', () => {
			it('should throw an error', async () => {
				const { updater } = setup();

				const element = mediaExternalToolElementFactory.build();

				await expect(() => updater.visitMediaExternalToolElementAsync(element)).rejects.toThrow();
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

	describe('when visiting a drawing element using the wrong content', () => {
		const setup = () => {
			const drawingElement = drawingElementFactory.build();
			const content = new FileContentBody();
			content.caption = 'a caption';
			const updater = new ContentElementUpdateVisitor(content);

			return { drawingElement, updater };
		};

		it('should throw an error', async () => {
			const { drawingElement, updater } = setup();

			await expect(() => updater.visitDrawingElementAsync(drawingElement)).rejects.toThrow();
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

	describe('when visiting a link element', () => {
		describe('when content is valid', () => {
			const setup = () => {
				const linkElement = linkElementFactory.build();
				const content = new LinkContentBody();
				content.url = 'https://super-example.com/';
				content.title = 'SuperExample - the best examples in the web';
				content.imageUrl = '/preview/image.jpg';
				const updater = new ContentElementUpdateVisitor(content);

				return { linkElement, content, updater };
			};

			it('should update the content', async () => {
				const { linkElement, content, updater } = setup();

				await updater.visitLinkElementAsync(linkElement);

				expect(linkElement.url).toEqual(content.url);
				expect(linkElement.title).toEqual(content.title);
				expect(linkElement.imageUrl).toEqual(content.imageUrl);
			});
		});

		describe('when content is not a link element', () => {
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

		describe('when imageUrl for preview image is not a relative url', () => {
			const setup = () => {
				const linkElement = linkElementFactory.build();
				const content = new LinkContentBody();
				content.url = 'https://super-example.com/';
				content.title = 'SuperExample - the best examples in the web';
				content.imageUrl = 'https://www.external.de/fake-preview-image.jpg';
				const updater = new ContentElementUpdateVisitor(content);

				return { linkElement, content, updater };
			};

			it('should ignore the image url', async () => {
				const { linkElement, updater } = setup();

				await updater.visitLinkElementAsync(linkElement);

				expect(linkElement.imageUrl).toBe('');
			});
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
