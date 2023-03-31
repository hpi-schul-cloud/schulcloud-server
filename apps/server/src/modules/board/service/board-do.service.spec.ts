import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { cardFactory, columnFactory, textElementFactory } from '@shared/testing/factory/domainobject';
import { Logger } from '@src/core/logger';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';

describe(BoardDoService.name, () => {
	let module: TestingModule;
	let service: BoardDoService;
	let boardDoRepo: DeepMocked<BoardDoRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardDoService,
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

		service = module.get(BoardDoService);
		boardDoRepo = module.get(BoardDoRepo);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('moveBoardDo', () => {
		describe('when moving a card', () => {
			const setup = () => {
				const cards = cardFactory.buildListWithId(3);
				const sourceColumn = columnFactory.buildWithId({ children: [...cards] });
				const targetCards = cardFactory.buildListWithId(2);
				const targetColumn = columnFactory.buildWithId({ children: [...targetCards] });

				boardDoRepo.findParentOfId.mockResolvedValue(sourceColumn);
				boardDoRepo.findById.mockResolvedValue(targetColumn);

				return { cards, targetCards, sourceColumn, targetColumn };
			};

			it('should place it in the target column', async () => {
				const { cards, targetColumn } = setup();

				await service.moveBoardDo(cards[0].id, targetColumn.id, 0);
				const targetColumnCardIds = targetColumn.children.map((card) => card.id);
				expect(targetColumnCardIds).toContain(cards[0].id);
			});

			it('should place it at the right position in the target column', async () => {
				const { cards, targetCards, targetColumn } = setup();

				await service.moveBoardDo(cards[0].id, targetColumn.id, 1);
				const targetColumnCardIds = targetColumn.children.map((card) => card.id);
				expect(targetColumnCardIds).toEqual([targetCards[0].id, cards[0].id, targetCards[1].id]);
			});

			it('should remove it from the source column', async () => {
				const { cards, sourceColumn, targetColumn } = setup();

				await service.moveBoardDo(cards[0].id, targetColumn.id, 0);
				const sourceColumnCardIds = sourceColumn.children.map((card) => card.id);
				expect(sourceColumnCardIds).not.toContain(cards[0].id);
			});

			it('should persist source- and targetColumn', async () => {
				const { cards, sourceColumn, targetColumn } = setup();

				await service.moveBoardDo(cards[0].id, targetColumn.id, 0);

				expect(boardDoRepo.save).toHaveBeenCalledWith([sourceColumn, targetColumn]);
			});
		});

		describe('when card has no parent', () => {
			const setup = () => {
				const card = cardFactory.buildWithId();
				const targetColumn = columnFactory.buildWithId();

				boardDoRepo.findParentOfId.mockResolvedValue(undefined);
				boardDoRepo.findById.mockResolvedValue(targetColumn);

				return { card, targetColumn };
			};

			it('should persist source- and targetColumn', async () => {
				const { card, targetColumn } = setup();

				const fut = () => service.moveBoardDo(card.id, targetColumn.id, 0);

				await expect(fut).rejects.toThrow(BadRequestException);
			});
		});
	});

	describe('deleteChildWithDescendants', () => {
		describe('when deleting a child', () => {
			const setup = () => {
				const elements = textElementFactory.buildListWithId(3);
				const card = cardFactory.build({ children: elements });
				const cardId = card.id;

				return { card, elements, cardId };
			};

			it('should delete the child do', async () => {
				const { card, elements } = setup();

				boardDoRepo.findById.mockResolvedValueOnce(card);

				await service.deleteChildWithDescendants(card, elements[0].id);

				expect(boardDoRepo.save).toHaveBeenCalledWith(card.children, card.id);
				expect(boardDoRepo.deleteById).toHaveBeenCalledWith(elements[0].id);
			});

			it('should update the siblings', async () => {
				const { card, elements } = setup();

				boardDoRepo.findById.mockResolvedValueOnce(card);

				await service.deleteChildWithDescendants(card, elements[0].id);

				expect(boardDoRepo.save).toHaveBeenCalledWith([elements[1], elements[2]], card.id);
			});

			it('should throw if the child does not exist', async () => {
				const textElement = textElementFactory.buildWithId();
				const fakeId = new ObjectId().toHexString();

				await expect(service.deleteChildWithDescendants(textElement, fakeId)).rejects.toThrow();
			});
		});
	});
});
