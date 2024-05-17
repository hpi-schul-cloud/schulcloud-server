import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ContextExternalTool } from '@modules/tool/context-external-tool/domain';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
	ContentElementFactory,
	ContentElementType,
	FileElement,
	RichTextElement,
	SubmissionContainerElement,
} from '@shared/domain/domainobject';
import { InputFormat } from '@shared/domain/types';
import {
	cardFactory,
	drawingElementFactory,
	fileElementFactory,
	linkElementFactory,
	richTextElementFactory,
	setupEntities,
	submissionContainerElementFactory,
} from '@shared/testing';
import { contextExternalToolFactory } from '@src/modules/tool/context-external-tool/testing';
import {
	DrawingContentBody,
	FileContentBody,
	LinkContentBody,
	RichTextContentBody,
	SubmissionContainerContentBody,
} from '../controller/dto';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';
import { ContentElementService } from './content-element.service';

describe(ContentElementService.name, () => {
	let module: TestingModule;
	let service: ContentElementService;
	let boardDoRepo: DeepMocked<BoardDoRepo>;
	let boardDoService: DeepMocked<BoardDoService>;
	let contentElementFactory: DeepMocked<ContentElementFactory>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ContentElementService,
				{
					provide: BoardDoRepo,
					useValue: createMock<BoardDoRepo>(),
				},
				{
					provide: BoardDoService,
					useValue: createMock<BoardDoRepo>(),
				},
				{
					provide: ContentElementFactory,
					useValue: createMock<ContentElementFactory>(),
				},
			],
		}).compile();

		service = module.get(ContentElementService);
		boardDoRepo = module.get(BoardDoRepo);
		boardDoService = module.get(BoardDoService);
		contentElementFactory = module.get(ContentElementFactory);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findById', () => {
		describe('when trying get RichTextElement by id', () => {
			const setup = () => {
				const richTextElement = richTextElementFactory.build();
				boardDoRepo.findById.mockResolvedValue(richTextElement);

				return { richTextElement };
			};

			it('should return instance of RichTextElement', async () => {
				const { richTextElement } = setup();

				const result = await service.findById(richTextElement.id);

				expect(result).toBeInstanceOf(RichTextElement);
			});
		});

		describe('when trying get FileElement by id', () => {
			const setup = () => {
				const fileElement = fileElementFactory.build();
				boardDoRepo.findById.mockResolvedValue(fileElement);

				return { fileElement };
			};

			it('should return a FileElement', async () => {
				const { fileElement } = setup();

				const result = await service.findById(fileElement.id);

				expect(result).toBeInstanceOf(FileElement);
			});
		});

		describe('when trying get an wrong element by id', () => {
			const setup = () => {
				const cardElement = cardFactory.build();
				boardDoRepo.findById.mockResolvedValue(cardElement);

				return { cardElement };
			};

			it('should throw NotFoundException', async () => {
				const { cardElement } = setup();

				await expect(service.findById(cardElement.id)).rejects.toThrowError(NotFoundException);
			});
		});
	});

	describe('findParentOfId', () => {
		describe('when parent is a valid node', () => {
			const setup = () => {
				const card = cardFactory.build();
				const element = richTextElementFactory.build();

				return { element, card };
			};

			it('should call the repo', async () => {
				const { element, card } = setup();
				boardDoRepo.findParentOfId.mockResolvedValueOnce(card);

				await service.findParentOfId(element.id);

				expect(boardDoRepo.findParentOfId).toHaveBeenCalledWith(element.id);
			});

			it('should throw NotFoundException', async () => {
				const { element } = setup();

				boardDoRepo.findParentOfId.mockResolvedValue(undefined);

				await expect(service.findParentOfId(element.id)).rejects.toThrowError(NotFoundException);
			});

			it('should return the parent', async () => {
				const { element, card } = setup();
				boardDoRepo.findParentOfId.mockResolvedValueOnce(card);

				const result = await service.findParentOfId(element.id);

				expect(result).toEqual(card);
			});
		});
	});

	describe('countBoardUsageForExternalTools', () => {
		describe('when counting the amount of boards used by tools', () => {
			const setup = () => {
				const contextExternalTools: ContextExternalTool[] = contextExternalToolFactory.buildListWithId(3);

				boardDoRepo.countBoardUsageForExternalTools.mockResolvedValueOnce(3);

				return {
					contextExternalTools,
				};
			};

			it('should count the usages', async () => {
				const { contextExternalTools } = setup();

				await service.countBoardUsageForExternalTools(contextExternalTools);

				expect(boardDoRepo.countBoardUsageForExternalTools).toHaveBeenCalledWith(contextExternalTools);
			});

			it('should return the amount of boards', async () => {
				const { contextExternalTools } = setup();

				const result: number = await service.countBoardUsageForExternalTools(contextExternalTools);

				expect(result).toEqual(3);
			});
		});
	});

	describe('create', () => {
		describe('when creating a content element of type', () => {
			const setup = () => {
				const card = cardFactory.build();
				const cardId = card.id;
				const richTextElement = richTextElementFactory.build();

				contentElementFactory.build.mockReturnValue(richTextElement);

				return { card, cardId, richTextElement };
			};

			it('should call getElement method of ContentElementProvider', async () => {
				const { card } = setup();

				await service.create(card, ContentElementType.RICH_TEXT);

				expect(contentElementFactory.build).toHaveBeenCalledWith(ContentElementType.RICH_TEXT);
			});

			it('should call addChild method of parent element', async () => {
				const { card, richTextElement } = setup();
				const spy = jest.spyOn(card, 'addChild');

				await service.create(card, ContentElementType.RICH_TEXT);

				expect(spy).toHaveBeenCalledWith(richTextElement);
			});

			it('should call save method of boardDo repo', async () => {
				const { card, richTextElement } = setup();

				await service.create(card, ContentElementType.RICH_TEXT);

				expect(boardDoRepo.save).toHaveBeenCalledWith([richTextElement], card);
			});
		});

		describe('when creating a drawing element multiple times', () => {
			const setup = () => {
				const card = cardFactory.build();
				const drawingElement = drawingElementFactory.build();

				contentElementFactory.build.mockReturnValue(drawingElement);

				return { card, drawingElement };
			};

			it('should return error for second creation', async () => {
				const { card } = setup();

				await service.create(card, ContentElementType.DRAWING);

				await expect(service.create(card, ContentElementType.DRAWING)).rejects.toThrow(BadRequestException);
			});
		});
	});

	describe('delete', () => {
		describe('when deleting an element', () => {
			it('should call the service', async () => {
				const element = richTextElementFactory.build();

				await service.delete(element);

				expect(boardDoService.deleteWithDescendants).toHaveBeenCalledWith(element);
			});
		});
	});

	describe('move', () => {
		describe('when moving an element', () => {
			it('should call the service', async () => {
				const targetParent = cardFactory.build();
				const element = richTextElementFactory.build();

				await service.move(element, targetParent, 3);

				expect(boardDoService.move).toHaveBeenCalledWith(element, targetParent, 3);
			});
		});
	});

	describe('update', () => {
		describe('when element is a rich text element', () => {
			const setup = () => {
				const richTextElement = richTextElementFactory.build();
				const content = new RichTextContentBody();
				content.text = '<p>this has been updated</p>';
				content.inputFormat = InputFormat.RICH_TEXT_CK5;
				const card = cardFactory.build();
				boardDoRepo.findParentOfId.mockResolvedValue(card);

				return { richTextElement, content, card };
			};

			it('should update the element', async () => {
				const { richTextElement, content } = setup();

				await service.update(richTextElement, content);

				expect(richTextElement.text).toEqual(content.text);
				expect(richTextElement.inputFormat).toEqual(InputFormat.RICH_TEXT_CK5);
			});

			it('should persist the element', async () => {
				const { richTextElement, content, card } = setup();

				await service.update(richTextElement, content);

				expect(boardDoRepo.save).toHaveBeenCalledWith(richTextElement, card);
			});
		});

		describe('when element is a drawing element', () => {
			const setup = () => {
				const drawingElement = drawingElementFactory.build();
				const content = new DrawingContentBody();
				content.description = 'test-description';
				const card = cardFactory.build();
				boardDoRepo.findParentOfId.mockResolvedValue(card);

				return { drawingElement, content, card };
			};

			it('should update the element', async () => {
				const { drawingElement, content } = setup();

				await service.update(drawingElement, content);

				expect(drawingElement.description).toEqual(content.description);
			});

			it('should persist the element', async () => {
				const { drawingElement, content, card } = setup();

				await service.update(drawingElement, content);

				expect(boardDoRepo.save).toHaveBeenCalledWith(drawingElement, card);
			});
		});

		describe('when element is a file element', () => {
			const setup = () => {
				const fileElement = fileElementFactory.build();

				const content = new FileContentBody();
				content.caption = 'this has been updated';
				content.alternativeText = 'this altText has been updated';
				const card = cardFactory.build();
				boardDoRepo.findParentOfId.mockResolvedValue(card);

				return { fileElement, content, card };
			};

			it('should update the element', async () => {
				const { fileElement, content } = setup();

				await service.update(fileElement, content);

				expect(fileElement.caption).toEqual(content.caption);
				expect(fileElement.alternativeText).toEqual(content.alternativeText);
			});

			it('should persist the element', async () => {
				const { fileElement, content, card } = setup();

				await service.update(fileElement, content);

				expect(boardDoRepo.save).toHaveBeenCalledWith(fileElement, card);
			});
		});

		describe('when element is a link element', () => {
			const setup = () => {
				const linkElement = linkElementFactory.build();

				const content = new LinkContentBody();
				content.url = 'https://www.medium.com/great-article';
				const card = cardFactory.build();
				boardDoRepo.findParentOfId.mockResolvedValue(card);

				const imageResponse = {
					title: 'Webpage-title',
					description: '',
					url: linkElement.url,
					image: { url: 'https://my-open-graph-proxy.scvs.de/image/adefcb12ed3a' },
				};

				return { linkElement, content, card, imageResponse };
			};

			it('should persist the element', async () => {
				const { linkElement, content, card } = setup();

				await service.update(linkElement, content);

				expect(boardDoRepo.save).toHaveBeenCalledWith(linkElement, card);
			});

			it('should call open graph service', async () => {
				const { linkElement, content, card } = setup();

				await service.update(linkElement, content);

				expect(boardDoRepo.save).toHaveBeenCalledWith(linkElement, card);
			});
		});

		describe('when element is a submission container element', () => {
			const setup = () => {
				const submissionContainerElement = submissionContainerElementFactory.build();

				const content = new SubmissionContainerContentBody();
				content.dueDate = new Date();

				const card = cardFactory.build();
				boardDoRepo.findParentOfId.mockResolvedValue(card);

				return { submissionContainerElement, content, card };
			};

			it('should update the element', async () => {
				const { submissionContainerElement, content } = setup();

				const element = (await service.update(submissionContainerElement, content)) as SubmissionContainerElement;

				expect(element.dueDate).toEqual(content.dueDate);
			});

			it('should persist the element', async () => {
				const { submissionContainerElement, content, card } = setup();

				const element = await service.update(submissionContainerElement, content);

				expect(boardDoRepo.save).toHaveBeenCalledWith(element, card);
			});
		});
	});
});
