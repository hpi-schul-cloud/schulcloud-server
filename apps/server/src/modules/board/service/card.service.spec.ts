import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Card } from '@shared/domain';
import { setupEntities } from '@shared/testing';
import { cardFactory, columnFactory, textElementFactory } from '@shared/testing/factory/domainobject';
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

	describe('finding one specific card', () => {
		const setup = () => {
			const card = cardFactory.buildWithId();
			return { card, cardId: card.id };
		};

		it('should call the card repository', async () => {
			const { card, cardId } = setup();
			boardDoRepo.findByClassAndId.mockResolvedValueOnce(card);

			await service.findById(cardId);

			expect(boardDoRepo.findByClassAndId).toHaveBeenCalledWith(Card, cardId);
		});

		it('should return the domain objects from the card repository', async () => {
			const { card, cardId } = setup();
			boardDoRepo.findByClassAndId.mockResolvedValueOnce(card);

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

			expect(boardDoRepo.findByIds).toHaveBeenCalledWith(cardIds);
		});

		it('should return the domain objects from the card repository', async () => {
			const { cards, cardIds } = setup();
			boardDoRepo.findByIds.mockResolvedValueOnce(cards);

			const result = await service.findByIds(cardIds);

			expect(result).toEqual(cards);
		});

		it('should throw an error if some DOs are not cards', async () => {
			const textElements = textElementFactory.buildList(2);
			const textElementIds = textElements.map((t) => t.id);
			boardDoRepo.findByIds.mockResolvedValue(textElements);

			await expect(service.findByIds(textElementIds)).rejects.toThrow();
		});
	});

	describe('delete', () => {
		describe('when deleting a card by id', () => {
			it('should call the deleteChildWithDescendants of the board-do-service', async () => {
				const column = columnFactory.build();
				const card = cardFactory.build();

				await service.delete(column, card.id);

				expect(boardDoService.deleteChildWithDescendants).toHaveBeenCalledWith(column, card.id);
			});
		});
	});

	describe('move', () => {
		describe('when moving a card', () => {
			it('should call do service', async () => {
				const targetParent = columnFactory.build();
				const card = cardFactory.build();

				await service.move(card.id, targetParent.id, 3);

				expect(boardDoService.moveBoardDo).toHaveBeenCalledWith(card.id, targetParent.id, 3);
			});
		});
	});
});
