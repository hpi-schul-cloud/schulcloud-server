import {
	taskBoardElementFactory,
	lessonBoardElementFactory,
	boardFactory,
	taskFactory,
	lessonFactory,
	setupEntities,
} from '@shared/testing';
import { MikroORM } from '@mikro-orm/core';

describe('Board Entity', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('syncTasksFromList', () => {
		it('should remove tasks from board that are not in list', () => {
			const task = taskFactory.buildWithId();
			const taskElement = taskBoardElementFactory.buildWithId({ target: task });
			const board = boardFactory.buildWithId({ references: [taskElement] });

			board.syncTasksFromList([]);

			expect(board.references.count()).toEqual(0);
		});

		it('should NOT remove other elements from board that are not in list', () => {
			const lessonElement = lessonBoardElementFactory.buildWithId();
			const board = boardFactory.buildWithId({ references: [lessonElement] });

			board.syncTasksFromList([]);

			expect(board.references.count()).toEqual(1);
		});

		it('should add tasks to board', () => {
			const task = taskFactory.buildWithId();
			const board = boardFactory.buildWithId({ references: [] });

			board.syncTasksFromList([task]);

			expect(board.references.count()).toEqual(1);
		});

		it('should NOT add tasks to board that is already there', () => {
			const task = taskFactory.buildWithId();
			const taskElement = taskBoardElementFactory.buildWithId({ target: task });
			const board = boardFactory.buildWithId({ references: [taskElement] });

			board.syncTasksFromList([task]);

			expect(board.references.count()).toEqual(1);
		});
	});

	describe('syncLessonsFromList', () => {
		it('should remove lessons from board that are not in list', () => {
			const lesson = lessonFactory.buildWithId();
			const lessonElement = lessonBoardElementFactory.buildWithId({ target: lesson });
			const board = boardFactory.buildWithId({ references: [lessonElement] });

			board.syncLessonsFromList([]);

			expect(board.references.count()).toEqual(0);
		});

		it('should NOT remove other elements from board that are not in list', () => {
			const task = taskFactory.buildWithId();
			const taskElement = taskBoardElementFactory.buildWithId({ target: task });
			const board = boardFactory.buildWithId({ references: [taskElement] });

			board.syncLessonsFromList([]);

			expect(board.references.count()).toEqual(1);
		});

		it('should add lessons to board', () => {
			const lesson = lessonFactory.buildWithId();
			const board = boardFactory.buildWithId({ references: [] });

			board.syncLessonsFromList([lesson]);

			expect(board.references.count()).toEqual(1);
		});

		it('should NOT add lessons to board that is already there', () => {
			const lesson = lessonFactory.buildWithId();
			const lessonElement = lessonBoardElementFactory.buildWithId({ target: lesson });
			const board = boardFactory.buildWithId({ references: [lessonElement] });

			board.syncLessonsFromList([lesson]);

			expect(board.references.count()).toEqual(1);
		});
	});
});
