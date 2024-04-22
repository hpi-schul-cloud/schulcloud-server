import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Card, CardInitProps, ContentElementType } from '@shared/domain/domainobject';
import { setupEntities } from '@shared/testing';
import {
	cardFactory,
	columnBoardFactory,
	columnFactory,
	richTextElementFactory,
} from '@shared/testing/factory/domainobject';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';
import { CardService } from './card.service';
import { ContentElementService } from './content-element.service';

describe(CardService.name, () => {
	let module: TestingModule;
	let service: CardService;
	let boardDoRepo: DeepMocked<BoardDoRepo>;
	let boardDoService: DeepMocked<BoardDoService>;
	let contentElementService: DeepMocked<ContentElementService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CardService,
				{
					provide: BoardDoRepo,
					useValue: createMock<BoardDoRepo>(),
				},
				{
					provide: BoardDoService,
					useValue: createMock<BoardDoService>(),
				},
				{
					provide: ContentElementService,
					useValue: createMock<ContentElementService>(),
				},
			],
		}).compile();

		service = module.get(CardService);
		boardDoRepo = module.get(BoardDoRepo);
		boardDoService = module.get(BoardDoService);
		contentElementService = module.get(ContentElementService);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('findById', () => {
		describe('when finding one specific card', () => {
			const setup = () => {
				const card = cardFactory.build();
				return { card, cardId: card.id };
			};

			it('should call the board do repository', async () => {
				const { card, cardId } = setup();
				boardDoRepo.findByClassAndId.mockResolvedValueOnce(card);

				await service.findById(cardId);

				expect(boardDoRepo.findByClassAndId).toHaveBeenCalledWith(Card, cardId);
			});

			it('should return the domain objects from the board do repository', async () => {
				const { card, cardId } = setup();
				boardDoRepo.findByClassAndId.mockResolvedValueOnce(card);

				const result = await service.findById(cardId);

				expect(result).toEqual(card);
			});
		});
	});

	describe('findByIds', () => {
		describe('when finding many cards', () => {
			const setup = () => {
				const cards = cardFactory.buildList(3);
				const cardIds = cards.map((c) => c.id);

				return { cards, cardIds };
			};

			it('should call the card repository', async () => {
				const { cards, cardIds } = setup();
				boardDoRepo.findByIds.mockResolvedValueOnce(cards);

				await service.findByIds(cardIds);

				expect(boardDoRepo.findByIds).toHaveBeenCalledWith(cardIds);
			});

			it('should return the domain objects from the card repository', async () => {
				const { cards, cardIds } = setup();
				boardDoRepo.findByIds.mockResolvedValueOnce(cards);

				const result = await service.findByIds(cardIds);

				expect(result).toEqual(cards);
			});

			it('should throw an error if some DOs are not cards', async () => {
				const richTextElements = richTextElementFactory.buildList(2);
				const richTextElementIds = richTextElements.map((t) => t.id);
				boardDoRepo.findByIds.mockResolvedValue(richTextElements);

				await expect(service.findByIds(richTextElementIds)).rejects.toThrow();
			});
		});
	});

	describe('create', () => {
		describe('when creating a card', () => {
			const setup = () => {
				const column = columnFactory.build();
				const columnId = column.id;
				const createCardBodyParams = {
					requiredEmptyElements: [ContentElementType.FILE, ContentElementType.RICH_TEXT],
				};

				return { column, columnId, createCardBodyParams };
			};

			it('should save a list of cards using the boardDo repo', async () => {
				const { column } = setup();

				await service.create(column);

				expect(boardDoRepo.save).toHaveBeenCalledWith(
					[
						expect.objectContaining({
							id: expect.any(String),
							title: '',
							createdAt: expect.any(Date),
							updatedAt: expect.any(Date),
						}),
					],
					column
				);
			});

			it('contentElementService.create should be called with given parameters', async () => {
				const { column, createCardBodyParams } = setup();

				const { requiredEmptyElements } = createCardBodyParams;

				await service.create(column, requiredEmptyElements);

				expect(contentElementService.create).toHaveBeenCalledTimes(2);
				expect(contentElementService.create).toHaveBeenNthCalledWith(1, expect.anything(), ContentElementType.FILE);
				expect(contentElementService.create).toHaveBeenNthCalledWith(
					2,
					expect.anything(),
					ContentElementType.RICH_TEXT
				);
			});
		});

		describe('when creating a card with initial props', () => {
			const setup = () => {
				const column = columnFactory.build();
				const cardInitProps: CardInitProps = {
					title: 'card #1',
					height: 42,
				};

				return { column, cardInitProps };
			};

			it('should set and save card with initial props', async () => {
				const { column, cardInitProps } = setup();

				await service.create(column, undefined, cardInitProps);

				expect(boardDoRepo.save).toHaveBeenCalledWith(
					[
						expect.objectContaining({
							id: expect.any(String),
							title: cardInitProps.title,
							height: cardInitProps.height,
							createdAt: expect.any(Date),
							updatedAt: expect.any(Date),
						}),
					],
					column
				);
			});
		});
	});

	describe('createMany', () => {
		describe('when creating many cards', () => {
			const setup = () => {
				const column = columnFactory.build();
				const cardInitProps = cardFactory.buildList(3);

				return { column, cardInitProps };
			};

			it('should save a list of cards using the boardDo repo', async () => {
				const { column, cardInitProps } = setup();

				const result = await service.createMany(column, cardInitProps);

				expect(result).toHaveLength(3);
				expect(boardDoRepo.save).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('delete', () => {
		describe('when deleting a card', () => {
			it('should call the service', async () => {
				const card = cardFactory.build();

				await service.delete(card);

				expect(boardDoService.deleteWithDescendants).toHaveBeenCalledWith(card);
			});
		});
	});

	describe('move', () => {
		describe('when moving a card', () => {
			it('should call the service', async () => {
				const targetParent = columnFactory.build();
				const card = cardFactory.build();

				await service.move(card, targetParent, 3);

				expect(boardDoService.move).toHaveBeenCalledWith(card, targetParent, 3);
			});
		});
	});

	describe('updateTitle', () => {
		describe('when updating the title', () => {
			it('should call the repo to save the updated card', async () => {
				const card = cardFactory.build({ title: 'card #1' });
				const column = columnFactory.build({ children: [card] });
				const columnBoard = columnBoardFactory.build({ children: [column] });
				boardDoRepo.findParentOfId.mockResolvedValueOnce(columnBoard);

				const newTitle = 'new title';

				await service.updateTitle(card, newTitle);

				expect(boardDoRepo.save).toHaveBeenCalledWith(
					expect.objectContaining({
						id: expect.any(String),
						title: newTitle,
						height: expect.any(Number),
						children: [],
						createdAt: expect.any(Date),
						updatedAt: expect.any(Date),
					}),
					columnBoard
				);
			});
		});
	});

	describe('setHeight', () => {
		describe('when updating the height', () => {
			it('should call the repo to save the updated card', async () => {
				const card = cardFactory.build({ height: 10 });
				const column = columnFactory.build({ children: [card] });
				const columnBoard = columnBoardFactory.build({ children: [column] });
				boardDoRepo.findParentOfId.mockResolvedValueOnce(columnBoard);

				const newHeight = 42;

				await service.updateHeight(card, newHeight);

				expect(boardDoRepo.save).toHaveBeenCalledWith(
					expect.objectContaining({
						id: expect.any(String),
						title: expect.any(String),
						height: newHeight,
						children: [],
						createdAt: expect.any(Date),
						updatedAt: expect.any(Date),
					}),
					columnBoard
				);
			});
		});
	});
});
