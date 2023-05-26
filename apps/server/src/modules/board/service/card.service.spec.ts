import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Card } from '@shared/domain';
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

describe(CardService.name, () => {
	let module: TestingModule;
	let service: CardService;
	let boardDoRepo: DeepMocked<BoardDoRepo>;
	let boardDoService: DeepMocked<BoardDoService>;

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
			],
		}).compile();

		service = module.get(CardService);
		boardDoRepo = module.get(BoardDoRepo);
		boardDoService = module.get(BoardDoService);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
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
				const { cardIds } = setup();

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

				return { column, columnId };
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
			it('should call the service', async () => {
				const card = cardFactory.build();
				const column = columnFactory.build({ children: [card] });
				const columnBoard = columnBoardFactory.build({ children: [column] });
				boardDoRepo.findParentOfId.mockResolvedValueOnce(columnBoard);

				const newTitle = 'new title';

				await service.updateTitle(card, newTitle);

				expect(boardDoRepo.save).toHaveBeenCalledWith(
					expect.objectContaining({
						id: expect.any(String),
						title: newTitle,
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
