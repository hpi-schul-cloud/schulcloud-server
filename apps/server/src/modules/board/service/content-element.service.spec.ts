import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ContentElementFactory, FileElement, TextElement } from '@shared/domain';
import { setupEntities } from '@shared/testing';
import { cardFactory, fileElementFactory, textElementFactory } from '@shared/testing/factory/domainobject';
import { Logger } from '@src/core/logger';
import { BoardDoRepo } from '../repo';
import { ContentElementType } from '../types';
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
					provide: Logger,
					useValue: createMock<Logger>(),
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
		describe('when trying get TextElement by id', () => {
			const setup = () => {
				const textElement = textElementFactory.build();
				boardDoRepo.findById.mockResolvedValue(textElement);

				return { textElement };
			};

			it('should return instance of TextElement', async () => {
				const { textElement } = setup();

				const result = await service.findById(textElement.id);

				expect(result).toBeInstanceOf(TextElement);
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
				const textElement = textElementFactory.build();

				contentElementFactory.build.mockReturnValue(textElement);

				return { card, cardId, textElement };
			};

			it('should call getElement method of ContentElementProvider', async () => {
				const { card } = setup();

				await service.create(card, ContentElementType.TEXT);

				expect(contentElementFactory.build).toHaveBeenCalledWith(ContentElementType.TEXT);
			});

			it('should call addChild method of parent element', async () => {
				const { card, textElement } = setup();
				const spy = jest.spyOn(card, 'addChild');

				await service.create(card, ContentElementType.TEXT);

				expect(spy).toHaveBeenCalledWith(textElement);
			});

			it('should call save method of boardDo repo', async () => {
				const { card, textElement } = setup();

				await service.create(card, ContentElementType.TEXT);

				expect(boardDoRepo.save).toHaveBeenCalledWith([textElement], card);
			});
		});
	});

	describe('delete', () => {
		describe('when deleting an element', () => {
			it('should call the service', async () => {
				const element = textElementFactory.build();

				await service.delete(element);

				expect(boardDoService.deleteWithDescendants).toHaveBeenCalledWith(element);
			});
		});
	});

	describe('move', () => {
		describe('when moving an element', () => {
			it('should call the service', async () => {
				const targetParent = cardFactory.build();
				const element = textElementFactory.build();

				await service.move(element, targetParent, 3);

				expect(boardDoService.move).toHaveBeenCalledWith(element, targetParent, 3);
			});
		});
	});
});
