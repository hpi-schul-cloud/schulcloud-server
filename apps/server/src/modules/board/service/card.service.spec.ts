import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import {
	cardFactory,
	columnBoardFactory,
	columnFactory,
	textElementFactory,
} from '@shared/testing/factory/domainobject';
import { Logger } from '@src/core/logger';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';
import { CardService } from './card.service';

describe(CardService.name, () => {
	let module: TestingModule;
	let service: CardService;
	let boardDoRepo: DeepMocked<BoardDoRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CardService,
				{
					provide: BoardDoRepo,
					useValue: createMock<BoardDoRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(CardService);
		boardDoRepo = module.get(BoardDoRepo);

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
			boardDoRepo.findById.mockResolvedValueOnce(card);

			await service.findById(cardId);

			expect(boardDoRepo.findById).toHaveBeenCalledWith(cardId);
		});

		it('should return the domain objects from the card repository', async () => {
			const { card, cardId } = setup();
			boardDoRepo.findById.mockResolvedValueOnce(card);

			const result = await service.findById(cardId);

			expect(result).toEqual(card);
		});

		it('should throw if the domain object does not exist', async () => {
			const fakeId = new ObjectId().toHexString();

			await expect(service.findById(fakeId)).rejects.toThrow();
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

	describe('creating a card', () => {
		const setup = () => {
			const column = columnFactory.build();
			const board = columnBoardFactory.build({ children: [column] });
			const boardId = board.id;
			const columnId = column.id;

			return { board, boardId, column, columnId };
		};

		it('should save a list of cards using the repo', async () => {
			const { board, boardId, columnId } = setup();

			boardDoRepo.findById.mockResolvedValueOnce(board);

			await service.createCard(boardId, columnId);

			expect(boardDoRepo.save).toHaveBeenCalledWith(
				[
					expect.objectContaining({
						id: expect.any(String),
						title: '',
						height: 150,
						children: [],
						createdAt: expect.any(Date),
						updatedAt: expect.any(Date),
					}),
				],
				columnId
			);
		});

		it('should throw not found exception if requested column id has not been found', async () => {
			const { board, boardId } = setup();

			const notExistingColumnId = new ObjectId().toHexString();
			const error = new NotFoundException(`The requested Column: id='${notExistingColumnId}' has not been found.`);

			boardDoRepo.findById.mockResolvedValueOnce(board);

			await expect(service.createCard(boardId, notExistingColumnId)).rejects.toThrowError(error);
		});
	});
});
