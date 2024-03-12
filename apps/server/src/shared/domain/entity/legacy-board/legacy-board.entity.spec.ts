import { BadRequestException } from '@nestjs/common';
import {
	boardFactory,
	columnboardBoardElementFactory,
	columnBoardFactory,
	columnBoardNodeFactory,
	courseFactory,
	lessonBoardElementFactory,
	lessonFactory,
	setupEntities,
	taskBoardElementFactory,
	taskFactory,
} from '@shared/testing';

describe('Board Entity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('getByTargetId', () => {
		it('should return target', () => {
			const task = taskFactory.buildWithId();
			const taskElement = taskBoardElementFactory.buildWithId({ target: task });
			const board = boardFactory.buildWithId({ references: [taskElement] });

			const result = board.getByTargetId(task.id);
			expect(result).toEqual(task);
		});

		it('should throw when target doesnt exist', () => {
			const board = boardFactory.buildWithId({ references: [] });

			const call = () => board.getByTargetId('this-does-not-exist');
			expect(call).toThrow();
		});
	});

	describe('reorderElements', () => {
		it('it should reorder exisiting elements', () => {
			const tasks = [taskFactory.buildWithId(), taskFactory.buildWithId(), taskFactory.buildWithId()];
			const board = boardFactory.buildWithId({});
			board.syncBoardElementReferences(tasks);
			const newOrder = [tasks[1], tasks[0], tasks[2]].map((el) => el.id);

			board.reorderElements(newOrder);

			const resultOrder = board.getElements().map((el) => el.target.id);
			expect(resultOrder).toEqual(newOrder);
		});

		it('should throw when element is missing in new order', () => {
			const tasks = [taskFactory.buildWithId(), taskFactory.buildWithId(), taskFactory.buildWithId()];
			const board = boardFactory.buildWithId({});
			board.syncBoardElementReferences(tasks);
			const newOrder = [tasks[1], tasks[0]].map((el) => el.id);

			const call = () => board.reorderElements(newOrder);

			expect(call).toThrow(BadRequestException);
		});

		it('should throw when additional element in new order', () => {
			const tasks = [taskFactory.buildWithId(), taskFactory.buildWithId(), taskFactory.buildWithId()];
			const additional = taskFactory.buildWithId();
			const board = boardFactory.buildWithId({});
			board.syncBoardElementReferences(tasks);
			const newOrder = [tasks[1], tasks[0], additional].map((el) => el.id);

			const call = () => board.reorderElements(newOrder);

			expect(call).toThrow(BadRequestException);
		});

		it('should throw when element is passed twice', () => {
			const tasks = [taskFactory.buildWithId(), taskFactory.buildWithId(), taskFactory.buildWithId()];
			const board = boardFactory.buildWithId({});
			board.syncBoardElementReferences(tasks);
			const newOrder = [tasks[1], tasks[0], tasks[2], tasks[1]].map((el) => el.id);

			const call = () => board.reorderElements(newOrder);

			expect(call).toThrow(BadRequestException);
		});
	});

	describe('syncBoardElementReferences', () => {
		it('should remove tasks from board that are not in list', () => {
			const task = taskFactory.buildWithId();
			const taskElement = taskBoardElementFactory.buildWithId({ target: task });
			const board = boardFactory.buildWithId({ references: [taskElement] });

			board.syncBoardElementReferences([]);

			expect(board.references.count()).toEqual(0);
		});

		it('should remove lessons from board that are not in list', () => {
			const lesson = lessonFactory.buildWithId();
			const lessonElement = lessonBoardElementFactory.buildWithId({ target: lesson });
			const board = boardFactory.buildWithId({ references: [lessonElement] });

			board.syncBoardElementReferences([]);

			expect(board.references.count()).toEqual(0);
		});

		it('should remove columnBoards from board that are not in list', () => {
			const columnBoard = columnBoardFactory.build();
			const columnboardBoardElement = columnboardBoardElementFactory.buildWithId({ target: columnBoard });
			const board = boardFactory.buildWithId({ references: [columnboardBoardElement] });

			board.syncBoardElementReferences([]);

			expect(board.references.count()).toEqual(0);
		});

		it('should add tasks to board', () => {
			const task = taskFactory.buildWithId();
			const board = boardFactory.buildWithId({ references: [] });

			board.syncBoardElementReferences([task]);

			expect(board.references.count()).toEqual(1);
		});

		it('should NOT add tasks to board that is already there', () => {
			const task = taskFactory.buildWithId();
			const taskElement = taskBoardElementFactory.buildWithId({ target: task });
			const board = boardFactory.buildWithId({ references: [taskElement] });

			board.syncBoardElementReferences([task]);

			expect(board.references.count()).toEqual(1);
		});

		it('should add new tasks to the beginning of the list', () => {
			const task = taskFactory.buildWithId();
			const existingTask = taskFactory.buildWithId();
			const taskElement = taskBoardElementFactory.buildWithId({ target: existingTask });
			const board = boardFactory.buildWithId({ references: [taskElement] });

			board.syncBoardElementReferences([existingTask, task]);

			expect(board.references[0].target.id).toEqual(task.id);
		});

		it('should add lessons to board', () => {
			const lesson = lessonFactory.buildWithId();
			const board = boardFactory.buildWithId({ references: [] });

			board.syncBoardElementReferences([lesson]);

			expect(board.references.count()).toEqual(1);
		});

		it('should NOT add lessons to board that is already there', () => {
			const lesson = lessonFactory.buildWithId();
			const lessonElement = lessonBoardElementFactory.buildWithId({ target: lesson });
			const board = boardFactory.buildWithId({ references: [lessonElement] });

			board.syncBoardElementReferences([lesson]);

			expect(board.references.count()).toEqual(1);
		});

		it('should add new lessons to the beginning of the list', () => {
			const lesson = lessonFactory.buildWithId();
			const existinglesson = lessonFactory.buildWithId();
			const lessonElement = lessonBoardElementFactory.buildWithId({ target: existinglesson });
			const board = boardFactory.buildWithId({ references: [lessonElement] });

			board.syncBoardElementReferences([existinglesson, lesson]);

			expect(board.references[0].target.id).toEqual(lesson.id);
		});

		it('should add columnboards to board', () => {
			const columnBoardTarget = columnBoardNodeFactory.buildWithId();
			const board = boardFactory.buildWithId({ references: [] });

			board.syncBoardElementReferences([columnBoardTarget]);

			expect(board.references.count()).toEqual(1);
		});

		it('should NOT add columnboards to board that is already there', () => {
			const target = columnBoardNodeFactory.buildWithId();
			const boardElement = columnboardBoardElementFactory.buildWithId({ target });
			const board = boardFactory.buildWithId({ references: [boardElement] });

			board.syncBoardElementReferences([target]);

			expect(board.references.count()).toEqual(1);
		});

		it('should add new columnboards to the beginning of the list', () => {
			const newTarget = columnBoardNodeFactory.buildWithId();
			const existingTarget = columnBoardNodeFactory.buildWithId();
			const existingElement = columnboardBoardElementFactory.buildWithId({ target: existingTarget });
			const board = boardFactory.buildWithId({ references: [existingElement] });

			board.syncBoardElementReferences([existingTarget, newTarget]);

			expect(board.references[0].target.id).toEqual(newTarget.id);
		});

		describe('when board element has an invalid type', () => {
			it('should throw an error', () => {
				const course = courseFactory.buildWithId();
				const board = boardFactory.buildWithId({ references: [] });

				// @ts-expect-error invalid target type
				expect(() => board.syncBoardElementReferences([course])).toThrow();
			});
		});
	});
});
