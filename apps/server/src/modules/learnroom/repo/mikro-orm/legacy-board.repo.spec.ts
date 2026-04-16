import { EntityManager } from '@mikro-orm/mongodb';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { lessonFactory } from '@modules/lesson/testing';
import { SchoolEntity } from '@modules/school/repo';
import { Submission, Task } from '@modules/task/repo';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { boardFactory, lessonBoardElementFactory, taskBoardElementFactory } from '../../testing';
import { LegacyBoardElement } from './legacy-board-element.entity';
import { LegacyBoard } from './legacy-board.entity';
import { LegacyBoardRepo } from './legacy-board.repo';
import { LessonBoardElement } from './lesson-board-element.entity';
import { TaskBoardElement } from './task-board-element.entity';

describe('LegacyRoomBoardRepo', () => {
	let module: TestingModule;
	let repo: LegacyBoardRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [
						LegacyBoard,
						CourseEntity,
						LegacyBoardElement,
						CourseGroupEntity,
						SchoolEntity,
						Submission,
						Task,
						LessonEntity,
						Material,
						TaskBoardElement,
						LessonBoardElement,
					],
				}),
			],
			providers: [LegacyBoardRepo],
		}).compile();
		repo = module.get(LegacyBoardRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
		await em.nativeDelete(LegacyBoard, {});
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(LegacyBoard);
	});

	describe('findByCourseId', () => {
		it('should return existing board', async () => {
			const course = courseEntityFactory.build();
			const taskElement = taskBoardElementFactory.build({ target: { course } });
			const lessonElement = lessonBoardElementFactory.build({ target: { course } });
			const board = boardFactory.build({ course, references: [taskElement, lessonElement] });
			await em.persist(board).flush();

			em.clear();

			const result = await repo.findByCourseId(course.id);
			expect(result.id).toEqual(board.id);
		});

		it('should return fresh board if none exists yet', async () => {
			const course = courseEntityFactory.build();
			await em.persist(course).flush();
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

		const result = await em.findOneOrFail(LegacyBoard, { id: board.id });
		expect(result.id).toEqual(board.id);
	});

	it('should load board with content', async () => {
		const taskElement = taskBoardElementFactory.build();
		const lessonElement = lessonBoardElementFactory.build();
		const board = boardFactory.build({ references: [taskElement, lessonElement] });
		await em.persist(board).flush();

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
		const lesson = lessonFactory.build();
		await em.persist(lesson).flush();
		const lessonElement = lessonBoardElementFactory.build({ target: lesson });
		const board = boardFactory.build({ references: [lessonElement] });
		await repo.save(board);

		em.clear();

		const result = await repo.findById(board.id);
		const resultLesson = result.references.getItems()[0].target as LessonEntity;
		expect(resultLesson.hidden).toBeDefined();
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
