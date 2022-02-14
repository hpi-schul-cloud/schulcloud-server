import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Board } from '@shared/domain';
import { boardFactory, lessonBoardElementFactory, taskBoardElementFactory, cleanupCollections } from '@shared/testing';

import { MongoMemoryDatabaseModule } from '@shared/infra/database';

import { BoardRepo } from './board.repo';

describe('BoardRepo', () => {
	let module: TestingModule;
	let repo: BoardRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [BoardRepo],
		}).compile();
		repo = module.get(BoardRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
		await em.nativeDelete(Board, {});
	});

	it('should persist board with content', async () => {
		const taskElement = taskBoardElementFactory.build();
		const lessonElement = lessonBoardElementFactory.build();
		const board = boardFactory.build({ references: [taskElement, lessonElement] });
		await repo.save(board);

		em.clear();

		const result = await em.findOneOrFail(Board, { id: board.id });
		expect(result.id).toEqual(board.id);
	});

	it('should load board with content', async () => {
		const taskElement = taskBoardElementFactory.build();
		const lessonElement = lessonBoardElementFactory.build();
		const board = boardFactory.build({ references: [taskElement, lessonElement] });
		await em.persistAndFlush(board);

		em.clear();

		const result = await repo.findById(board.id);
		expect(result.id).toEqual(board.id);
	});

	it('should initialize reference collection', async () => {
		const taskElement = taskBoardElementFactory.build();
		const lessonElement = lessonBoardElementFactory.build();
		const board = boardFactory.build({ references: [taskElement, lessonElement] });
		await repo.save(board);

		em.clear();

		const result = await repo.findById(board.id);
		expect(result.references.isInitialized()).toEqual(true);
	});
});
