import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ContentElementFactory } from '@shared/domain/domainobject/board/content-element.factory';
import { FileElement } from '@shared/domain/domainobject/board/file-element.do';
import { RichTextElement } from '@shared/domain/domainobject/board/rich-text-element.do';
import { SubmissionContainerElement } from '@shared/domain/domainobject/board/submission-container-element.do';
import { ContentElementType } from '@shared/domain/domainobject/board/types/content-elements.enum';
import { InputFormat } from '@shared/domain/types/input-format.types';
import { cardFactory } from '@shared/testing/factory/domainobject/board/card.do.factory';
import { fileElementFactory } from '@shared/testing/factory/domainobject/board/file-element.do.factory';
import { linkElementFactory } from '@shared/testing/factory/domainobject/board/link-element.do.factory';
import { richTextElementFactory } from '@shared/testing/factory/domainobject/board/rich-text-element.do.factory';
import { submissionContainerElementFactory } from '@shared/testing/factory/domainobject/board/submission-container-element.do.factory';
import { setupEntities } from '@shared/testing/setup-entities';
import {
	FileContentBody,
	LinkContentBody,
	RichTextContentBody,
	SubmissionContainerContentBody,
} from '../controller/dto/element/update-element-content.body.params';
import { BoardDoRepo } from '../repo/board-do.repo';
import { BoardDoService } from './board-do.service';
import { ContentElementService } from './content-element.service';
import { OpenGraphProxyService } from './open-graph-proxy.service';

describe(ContentElementService.name, () => {
	let module: TestingModule;
	let service: ContentElementService;
	let boardDoRepo: DeepMocked<BoardDoRepo>;
	let boardDoService: DeepMocked<BoardDoService>;
	let contentElementFactory: DeepMocked<ContentElementFactory>;
	let openGraphProxyService: DeepMocked<OpenGraphProxyService>;

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
				{
					provide: OpenGraphProxyService,
					useValue: createMock<OpenGraphProxyService>(),
				},
			],
		}).compile();

		service = module.get(ContentElementService);
		boardDoRepo = module.get(BoardDoRepo);
		boardDoService = module.get(BoardDoService);
		contentElementFactory = module.get(ContentElementFactory);
		openGraphProxyService = module.get(OpenGraphProxyService);

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

				openGraphProxyService.fetchOpenGraphData.mockResolvedValueOnce(imageResponse);

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
