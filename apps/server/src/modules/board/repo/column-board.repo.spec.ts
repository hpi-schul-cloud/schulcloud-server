import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardNodeType } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections } from '@shared/testing';
import { boardNodeFactory } from '@shared/testing/factory/boardnode.factory';
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
		const boardNode = boardNodeFactory.build({ type: BoardNodeType.BOARD });
		await em.persistAndFlush(boardNode);
		const columnNodes = boardNodeFactory.buildList(2, { parent: boardNode, type: BoardNodeType.COLUMN });
		await em.persistAndFlush(columnNodes);
		const cardNodes = boardNodeFactory.buildList(2, { parent: columnNodes[0], type: BoardNodeType.CARD });
		await em.persistAndFlush(cardNodes);
		const elementNodes = boardNodeFactory.buildList(2, { parent: cardNodes[1], type: BoardNodeType.ELEMENT });
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
