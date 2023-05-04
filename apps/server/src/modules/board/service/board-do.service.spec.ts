import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections } from '@shared/testing';
import { cardFactory, columnFactory, textElementFactory } from '@shared/testing/factory/domainobject';
import { BoardDoRepo, BoardNodeRepo } from '../repo';
import { RecursiveDeleteVisitor } from '../repo/recursive-delete.vistor';
import { BoardDoService } from './board-do.service';

describe(BoardDoService.name, () => {
	let module: TestingModule;
	let service: BoardDoService;
	let boardDoRepo: BoardDoRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [BoardDoService, BoardDoRepo, BoardNodeRepo, RecursiveDeleteVisitor],
		}).compile();

		service = module.get(BoardDoService);
		boardDoRepo = module.get(BoardDoRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('move', () => {
		describe('when moving a card', () => {
			const setup = async () => {
				const cards = cardFactory.buildList(3);
				const sourceColumn = columnFactory.build({ children: cards });
				await boardDoRepo.save(sourceColumn);

				const targetCards = cardFactory.buildList(2);
				const targetColumn = columnFactory.build({ children: targetCards });
				await boardDoRepo.save(targetColumn);

				return { sourceColumn, targetColumn, cards, targetCards };
			};

			it('should place it in the target column', async () => {
				const { targetColumn, cards } = await setup();

				await service.move(cards[0], targetColumn, 0);

				expect(targetColumn.hasChild(cards[0])).toEqual(true);
			});

			it('should remove it from the source column', async () => {
				const { cards, sourceColumn, targetColumn } = await setup();

				await service.move(cards[0], targetColumn, 0);

				const resultColumn = await boardDoRepo.findById(sourceColumn.id);
				expect(resultColumn.hasChild(cards[0])).toBe(false);
			});

			it('should add it to the target column', async () => {
				const { cards, targetCards, targetColumn } = await setup();
				const expectedIds = [targetCards[0].id, cards[0].id, targetCards[1].id];

				await service.move(cards[0], targetColumn, 1);

				const resultColumn = await boardDoRepo.findById(targetColumn.id);
				expect(resultColumn.children.map((c) => c.id)).toEqual(expectedIds);
			});

			describe('when moving within the same parent', () => {
				it('should just change the position', async () => {
					const { cards, sourceColumn } = await setup();
					const expectedIds = [cards[1].id, cards[0].id, cards[2].id];

					await service.move(cards[0], sourceColumn, 1);

					const resultColumn = await boardDoRepo.findById(sourceColumn.id);
					expect(resultColumn.children.map((c) => c.id)).toEqual(expectedIds);
				});
			});
		});

		describe('when card has no parent', () => {
			const setup = async () => {
				const card = cardFactory.build();
				await boardDoRepo.save(card);
				const targetColumn = columnFactory.build();
				await boardDoRepo.save(targetColumn);

				return { card, targetColumn };
			};

			it('should move it to the column', async () => {
				const { card, targetColumn } = await setup();

				await service.move(card, targetColumn, 0);

				const resultColumn = await boardDoRepo.findById(targetColumn.id);
				expect(resultColumn.children.map((c) => c.id)).toEqual([card.id]);
			});
		});
	});

	describe('deleteWithDescendants', () => {
		describe('when deleting an object', () => {
			const setup = async () => {
				const elements = textElementFactory.buildList(3);
				const card = cardFactory.build({ children: elements });
				await boardDoRepo.save(card);

				return { card, elements };
			};

			it('should delete the object', async () => {
				const { elements } = await setup();

				await service.deleteWithDescendants(elements[0]);

				await expect(boardDoRepo.findById(elements[0].id)).rejects.toThrow();
			});

			it('should update the siblings', async () => {
				const { card, elements } = await setup();

				await service.deleteWithDescendants(elements[0]);

				const resultCard = await boardDoRepo.findById(card.id);
				expect(resultCard.children.map((c) => c.id)).toEqual([elements[1].id, elements[2].id]);
			});
		});
	});
});
