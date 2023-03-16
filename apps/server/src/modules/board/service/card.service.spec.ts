import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Card } from '@shared/domain';
import { setupEntities } from '@shared/testing';
import { cardFactory, columnBoardFactory, columnFactory } from '@shared/testing/factory/domainobject';
import { Logger } from '@src/core/logger';
import { CardRepo, ColumnBoardRepo } from '../repo';
import { CardService } from './card.service';

describe(CardService.name, () => {
	let module: TestingModule;
	let service: CardService;
	let cardRepo: DeepMocked<CardRepo>;
	let columnBoardRepo: DeepMocked<ColumnBoardRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CardService,
				{
					provide: CardRepo,
					useValue: createMock<CardRepo>(),
				},
				{
					provide: ColumnBoardRepo,
					useValue: createMock<ColumnBoardRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(CardService);
		cardRepo = module.get(CardRepo);
		columnBoardRepo = module.get(ColumnBoardRepo);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('finding one specific card', () => {
		const setup = () => {
			const card = cardFactory.build();
			return { card, cardId: card.id };
		};

		it('should call the card repository', async () => {
			const { cardId } = setup();

			await service.findById(cardId);

			expect(cardRepo.findById).toHaveBeenCalledWith(cardId);
		});

		it('should return the domain objects from the card repository', async () => {
			const { card, cardId } = setup();
			cardRepo.findById.mockResolvedValueOnce(card);

			const result = await service.findById(cardId);

			expect(result).toEqual(card);
		});
	});

	describe('finding many cards', () => {
		const setup = () => {
			const cards = cardFactory.buildList(3);
			const cardIds = cards.map((c) => c.id);

			return { cards, cardIds };
		};

		it('should call the card repository', async () => {
			const { cardIds } = setup();

			await service.findByIds(cardIds);

			expect(cardRepo.findByIds).toHaveBeenCalledWith(cardIds);
		});

		it('should return the domain objects from the card repository', async () => {
			const { cards, cardIds } = setup();
			cardRepo.findByIds.mockResolvedValueOnce(cards);

			const result = await service.findByIds(cardIds);

			expect(result).toEqual(cards);
		});
	});

	describe('creating a new card', () => {
		it('should save a list of cards using the repo', async () => {
			const column = columnFactory.build();
			const board = columnBoardFactory.build({ columns: [column] });
			const boardId = board.id;
			const columnId = column.id;

			columnBoardRepo.findById.mockResolvedValueOnce(board);

			await service.createCard(boardId, columnId);

			const cardsList = cardRepo.save.mock.calls[0][0];
			const parentId = cardRepo.save.mock.calls[0][1];
			expect(cardsList).toBeInstanceOf(Array<Card>);
			expect(parentId).toEqual(parentId);
		});
	});
});
