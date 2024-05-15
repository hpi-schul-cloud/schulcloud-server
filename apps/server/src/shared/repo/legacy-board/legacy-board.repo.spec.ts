import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacyBoard, LessonEntity, Task } from '@shared/domain/entity';

import { MongoMemoryDatabaseModule } from '@infra/database';

import { createMock, DeepMocked } from '@golevelup/ts-jest';
import {
	boardFactory,
	cleanupCollections,
	courseFactory,
	lessonBoardElementFactory,
	lessonFactory,
	taskBoardElementFactory,
} from '@shared/testing';
import { BoardNodeService } from '@src/modules/board';
import { LegacyBoardRepo } from './legacy-board.repo';

describe('LegacyRoomBoardRepo', () => {
	let module: TestingModule;
	let repo: LegacyBoardRepo;
	let em: EntityManager;
	let boardNodeService: DeepMocked<BoardNodeService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				LegacyBoardRepo,
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
			],
		}).compile();
		repo = module.get(LegacyBoardRepo);
		em = module.get(EntityManager);
		boardNodeService = module.get(BoardNodeService);
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

		const result = await em.findOneOrFail(LegacyBoard, { id: board.id });
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
		const lesson = lessonFactory.build();
		await em.persistAndFlush(lesson);
		const lessonElement = lessonBoardElementFactory.build({ target: lesson });
		const board = boardFactory.build({ references: [lessonElement] });
		await repo.save(board);

		em.clear();

		const result = await repo.findById(board.id);
		const resultLesson = result.references.getItems()[0].target as unknown as LessonEntity;
		expect(resultLesson.hidden).toBeDefined();
	});

	it('should populate task in element', async () => {
		const taskElement = taskBoardElementFactory.build();
		const board = boardFactory.build({ references: [taskElement] });
		await repo.save(board);

		em.clear();

		const result = await repo.findById(board.id);
		const task = result.references.getItems()[0].target as unknown as Task;
		expect(task.name).toBeDefined();
	});
});
