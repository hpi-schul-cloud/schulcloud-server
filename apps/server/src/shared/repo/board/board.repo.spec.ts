import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Board, Lesson, Task } from '@shared/domain';
import {
	courseFactory,
	boardFactory,
	lessonBoardElementFactory,
	taskBoardElementFactory,
	cleanupCollections,
} from '@shared/testing';

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

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(Board);
	});

	describe('findByCourseId', () => {
		it('should return existing board', async () => {
			const course = courseFactory.build();
			const taskElement = taskBoardElementFactory.build({ target: { course } });
			const lessonElement = lessonBoardElementFactory.build({ target: { course } });
			const board = boardFactory.build({ course, references: [taskElement, lessonElement] });
			await em.persistAndFlush(board);

			em.clear();

			const result = await repo.findByCourseId(course.id);
			expect(result.id).toEqual(board.id);
		});

		it('should return fresh board if none exists yet', async () => {
			const course = courseFactory.build();
			await em.persistAndFlush(course);
			em.clear();
			const result = await repo.findByCourseId(course.id);
			expect(result).toHaveProperty('id');
		});

		it('should throw for course that doesnt exist', async () => {
			const call = () => repo.findByCourseId('FAKEcourseId');
			await expect(call).rejects.toThrow();
		});
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

	it('should populate lesson in element', async () => {
		const lessonElement = lessonBoardElementFactory.build();
		const board = boardFactory.build({ references: [lessonElement] });
		await repo.save(board);

		em.clear();

		const result = await repo.findById(board.id);
		const lesson = result.references.getItems()[0].target as Lesson;
		expect(lesson.hidden).toBeDefined();
	});

	it('should populate task in element', async () => {
		const taskElement = taskBoardElementFactory.build();
		const board = boardFactory.build({ references: [taskElement] });
		await repo.save(board);

		em.clear();

		const result = await repo.findById(board.id);
		const task = result.references.getItems()[0].target as Task;
		expect(task.name).toBeDefined();
	});
});
