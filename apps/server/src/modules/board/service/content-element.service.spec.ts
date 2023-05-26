import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ContentElementFactory, ContentElementType, FileElement, InputFormat, RichTextElement } from '@shared/domain';
import { setupEntities } from '@shared/testing';
import { cardFactory, fileElementFactory, richTextElementFactory } from '@shared/testing/factory/domainobject';
import { FileContentBody, RichTextContentBody } from '../controller/dto';
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
				content.fileName = 'this has been updated';
				const card = cardFactory.build();
				boardDoRepo.findParentOfId.mockResolvedValue(card);

				return { fileElement, content, card };
			};

			it('should update the element', async () => {
				const { fileElement, content } = setup();

				await service.update(fileElement, content);

				expect(fileElement.caption).toEqual(content.caption);
				expect(fileElement.fileName).toEqual(content.fileName);
			});

			it('should persist the element', async () => {
				const { fileElement, content, card } = setup();

				await service.update(fileElement, content);

				expect(boardDoRepo.save).toHaveBeenCalledWith(fileElement, card);
			});
		});
	});
});
