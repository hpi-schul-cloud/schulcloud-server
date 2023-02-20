import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Lesson, SingleColumnBoard, Task } from '@shared/domain';
import {
	cleanupCollections,
	courseFactory,
	lessonBoardElementFactory,
	lessonFactory,
	singleColumnBoardFactory,
	taskBoardElementFactory,
} from '@shared/testing';

import { MongoMemoryDatabaseModule } from '@shared/infra/database';

import { columnBoardFactory } from '@shared/testing/factory/column-board.factory';
import { SingleColumnBoardRepo } from './single-column-board.repo';

describe('SingleColumnBoardRepo', () => {
	let module: TestingModule;
	let repo: SingleColumnBoardRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [SingleColumnBoardRepo],
		}).compile();
		repo = module.get(SingleColumnBoardRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
		await em.nativeDelete(SingleColumnBoard, {});
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(SingleColumnBoard);
	});

	describe('findByCourseId', () => {
		it('should return existing board', async () => {
			const course = courseFactory.build();
			const taskElement = taskBoardElementFactory.build({ target: { course } });
			const lessonElement = lessonBoardElementFactory.build({ target: { course } });
			const board = singleColumnBoardFactory.build({ course, references: [taskElement, lessonElement] });
			em.persist(board);
			await em.flush();

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
		const board = singleColumnBoardFactory.build({ references: [taskElement, lessonElement] });
		await repo.save(board);

		em.clear();

		const result = await em.findOneOrFail(SingleColumnBoard, { id: board.id });
		expect(result.id).toEqual(board.id);
	});

	it('should load board with content', async () => {
		const taskElement = taskBoardElementFactory.build();
		const lessonElement = lessonBoardElementFactory.build();
		const board = singleColumnBoardFactory.build({ references: [taskElement, lessonElement] });
		await em.persistAndFlush(board);

		em.clear();

		const result = await repo.findById(board.id);
		expect(result.id).toEqual(board.id);
	});

	it('should initialize reference collection', async () => {
		const taskElement = taskBoardElementFactory.build();
		const lessonElement = lessonBoardElementFactory.build();
		const board = singleColumnBoardFactory.build({ references: [taskElement, lessonElement] });
		await repo.save(board);

		em.clear();

		const result = await repo.findById(board.id);
		expect(result.references.isInitialized()).toEqual(true);
	});

	it('should populate lesson in element', async () => {
		const lesson = lessonFactory.build();
		await em.persistAndFlush(lesson);
		const lessonElement = lessonBoardElementFactory.build({ target: lesson });
		const board = singleColumnBoardFactory.build({ references: [lessonElement] });
		await repo.save(board);

		em.clear();

		const result = await repo.findById(board.id);
		const resultLesson = result.references.getItems()[0].target as Lesson;
		expect(resultLesson.hidden).toBeDefined();
	});

	it('should populate task in element', async () => {
		const taskElement = taskBoardElementFactory.build();
		const board = singleColumnBoardFactory.build({ references: [taskElement] });
		await repo.save(board);

		em.clear();

		const result = await repo.findById(board.id);
		const task = result.references.getItems()[0].target as Task;
		expect(task.name).toBeDefined();
	});

	it('should not load columnboards', async () => {
		const columnboard = columnBoardFactory.build();
		await em.persistAndFlush(columnboard);
		em.clear();

		const call = () => repo.findById(columnboard.id);
		await expect(call).rejects.toThrow();
	});
});
