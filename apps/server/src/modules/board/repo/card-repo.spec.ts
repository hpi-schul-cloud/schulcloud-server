import { NotFoundError } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { CardNode } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import {
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	textElementNodeFactory,
	cardFactory,
} from '@shared/testing';
import { BoardNodeRepo } from './board-node.repo';
import { CardRepo } from './card.repo';

describe(CardRepo.name, () => {
	let module: TestingModule;
	let repo: CardRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [CardRepo, BoardNodeRepo],
		}).compile();
		repo = module.get(CardRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('findById', () => {
		const setup = async () => {
			const boardNode = columnBoardNodeFactory.build();
			await em.persistAndFlush(boardNode);
			const columnNodes = columnNodeFactory.buildList(2, { parent: boardNode });
			await em.persistAndFlush(columnNodes);
			const cardNodes = cardNodeFactory.buildList(2, { parent: columnNodes[0] });
			await em.persistAndFlush(cardNodes);
			const elementNodes = textElementNodeFactory.buildList(2, { parent: cardNodes[1] });
			await em.persistAndFlush(elementNodes);
			em.clear();

			return { boardNode, columnNodes, cardNodes, elementNodes };
		};

		it('should find the card', async () => {
			const { cardNodes } = await setup();
			const result = await repo.findById(cardNodes[0].id);
			expect(result.id).toEqual(cardNodes[0].id);
		});

		it('should throw an error when not found', async () => {
			await expect(repo.findById('invalid-id')).rejects.toThrowError(NotFoundError);
		});
	});

	describe('save', () => {
		it('should save cards', async () => {
			const card = cardFactory.build();

			const columnNode = columnNodeFactory.build();
			await em.persistAndFlush(columnNode);

			await repo.save(card, columnNode.id);
			em.clear();

			const result = await em.findOne(CardNode, card.id);

			expect(result).toBeDefined();
		});
	});
});
