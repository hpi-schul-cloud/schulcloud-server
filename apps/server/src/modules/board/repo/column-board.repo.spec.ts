import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections, boardNodeFactory } from '@shared/testing';
import { AnyBoardDoBuilder } from '../mapper';
import { BoardNodeRepo } from './board-node.repo';
import { ColumnBoardRepo } from './column-board.repo';

describe('ColumnBoardRepo', () => {
	let module: TestingModule;
	let repo: ColumnBoardRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [ColumnBoardRepo, BoardNodeRepo, AnyBoardDoBuilder],
		}).compile();
		repo = module.get(ColumnBoardRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
		// await em.nativeDelete(BoardNode, {});
	});

	const setup = async () => {
		const boardNode = boardNodeFactory.asBoard().build();
		await em.persistAndFlush(boardNode);
		const columnNodes = boardNodeFactory.asColumn().buildList(2, { parent: boardNode });
		await em.persistAndFlush(columnNodes);
		const cardNodes = boardNodeFactory.asCard().buildList(2, { parent: columnNodes[0] });
		await em.persistAndFlush(cardNodes);
		const elementNodes = boardNodeFactory.asElement().buildList(2, { parent: cardNodes[1] });
		await em.persistAndFlush(elementNodes);
		em.clear();

		return { boardNode, columnNodes, cardNodes, elementNodes };
	};

	describe('findById', () => {
		it('should find the board node', async () => {
			const { boardNode } = await setup();
			const result = await repo.findById(boardNode.id);
			expect(result?.id).toEqual(boardNode.id);
		});
	});
});
