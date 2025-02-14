import { LegacyLogger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ColumnBoardService } from '@modules/board';
import { BoardExternalReferenceType } from '@modules/board/domain';
import { CopyColumnBoardParams } from '@modules/board/service/internal';
import { columnBoardFactory } from '@modules/board/testing';
import { CopyElementType, CopyHelperService, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { StorageLocation } from '@modules/files-storage/interface';
import { LessonCopyService } from '@modules/lesson';
import { TaskCopyService } from '@modules/task';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizableObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { courseFactory } from '@testing/factory/course.factory';
import { lessonFactory } from '@testing/factory/lesson.factory';
import { taskFactory } from '@testing/factory/task.factory';
import { userFactory } from '@testing/factory/user.factory';
import { setupEntities } from '@testing/setup-entities';
import { ColumnBoardNodeRepo, LegacyBoard, LegacyBoardRepo } from '../repo';
import {
	boardFactory,
	columnboardBoardElementFactory,
	columnBoardNodeFactory,
	lessonBoardElementFactory,
	taskBoardElementFactory,
} from '../testing';
import { BoardCopyService } from './board-copy.service';

describe('board copy service', () => {
	let module: TestingModule;
	let copyService: BoardCopyService;
	let taskCopyService: DeepMocked<TaskCopyService>;
	let lessonCopyService: DeepMocked<LessonCopyService>;
	let columnBoardService: DeepMocked<ColumnBoardService>;
	let copyHelperService: DeepMocked<CopyHelperService>;
	let boardRepo: DeepMocked<LegacyBoardRepo>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				BoardCopyService,
				{
					provide: TaskCopyService,
					useValue: createMock<TaskCopyService>(),
				},
				{
					provide: LessonCopyService,
					useValue: createMock<LessonCopyService>(),
				},
				{
					provide: ColumnBoardService,
					useValue: createMock<ColumnBoardService>(),
				},
				{
					provide: CopyHelperService,
					useValue: createMock<CopyHelperService>(),
				},
				{
					provide: LegacyBoardRepo,
					useValue: createMock<LegacyBoardRepo>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: ColumnBoardNodeRepo,
					useValue: createMock<ColumnBoardNodeRepo>(),
				},
			],
		}).compile();

		copyService = module.get(BoardCopyService);
		taskCopyService = module.get(TaskCopyService);
		lessonCopyService = module.get(LessonCopyService);
		copyHelperService = module.get(CopyHelperService);
		columnBoardService = module.get(ColumnBoardService);
		boardRepo = module.get(LegacyBoardRepo);
		boardRepo.save = jest.fn();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('copyBoard', () => {
		describe('when the board is empty', () => {
			const setup = () => {
				const destinationCourse = courseFactory.buildWithId();
				const originalBoard = boardFactory.buildWithId({ references: [], course: destinationCourse });
				const user = userFactory.build();

				return { destinationCourse, originalBoard, user };
			};

			it('should return copy type "board"', async () => {
				const { destinationCourse, originalBoard, user } = setup();

				const status = await copyService.copyBoard({
					originalBoard,
					user,
					originalCourse: destinationCourse,
					destinationCourse,
				});
				expect(status.type).toEqual(CopyElementType.BOARD);
			});

			it('should set title copy status to "board"', async () => {
				const { destinationCourse, originalBoard, user } = setup();

				const status = await copyService.copyBoard({
					originalBoard,
					user,
					originalCourse: destinationCourse,
					destinationCourse,
				});
				expect(status.title).toEqual('board');
			});

			it('should set original entity in status', async () => {
				const { destinationCourse, originalBoard, user } = setup();

				const status = await copyService.copyBoard({
					originalBoard,
					user,
					originalCourse: destinationCourse,
					destinationCourse,
				});
				expect(status.originalEntity).toEqual(originalBoard);
			});

			it('should create a copy', async () => {
				const { destinationCourse, originalBoard, user } = setup();

				const status = await copyService.copyBoard({
					originalBoard,
					user,
					originalCourse: destinationCourse,
					destinationCourse,
				});
				const board = status.copyEntity as LegacyBoard;
				expect(board.id).not.toEqual(originalBoard.id);
			});

			it('should set destination course of copy', async () => {
				const { destinationCourse, originalBoard, user } = setup();

				const status = await copyService.copyBoard({
					originalBoard,
					user,
					originalCourse: destinationCourse,
					destinationCourse,
				});
				const board = status.copyEntity as LegacyBoard;
				expect(board.course.id).toEqual(destinationCourse.id);
			});
		});

		describe('when board contains a task', () => {
			const setup = () => {
				const originalTask = taskFactory.build();
				const taskElement = taskBoardElementFactory.build({ target: originalTask });
				const destinationCourse = courseFactory.build();
				const originalBoard = boardFactory.build({ references: [taskElement], course: destinationCourse });
				const user = userFactory.build();
				const taskCopy = taskFactory.build({ name: originalTask.name });

				taskCopyService.copyTask.mockResolvedValue({
					title: taskCopy.name,
					type: CopyElementType.TASK,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: taskCopy,
				});

				return { destinationCourse, originalBoard, user, originalTask };
			};

			it('should call taskCopyService with original task', async () => {
				const { destinationCourse, originalBoard, user, originalTask } = setup();

				await copyService.copyBoard({ originalBoard, user, originalCourse: destinationCourse, destinationCourse });
				expect(taskCopyService.copyTask).toHaveBeenCalledWith({
					originalTaskId: originalTask.id,
					destinationCourse,
					user,
				});
			});

			it('should call copyHelperService', async () => {
				const { destinationCourse, originalBoard, user } = setup();

				await copyService.copyBoard({ originalBoard, user, originalCourse: destinationCourse, destinationCourse });
				expect(copyHelperService.deriveStatusFromElements).toHaveBeenCalledTimes(1);
			});

			it('should add copy of task to board copy', async () => {
				const { destinationCourse, originalBoard, user } = setup();

				const status = await copyService.copyBoard({
					originalBoard,
					user,
					originalCourse: destinationCourse,
					destinationCourse,
				});
				const board = status.copyEntity as LegacyBoard;
				expect(board.getElements().length).toEqual(1);
			});

			it('should add status of copying task to board copy status', async () => {
				const { destinationCourse, originalBoard, user, originalTask } = setup();

				const status = await copyService.copyBoard({
					originalBoard,
					user,
					originalCourse: destinationCourse,
					destinationCourse,
				});
				const taskStatus = status.elements?.find(
					(el) => el.type === CopyElementType.TASK && el.title === originalTask.name
				);
				expect(taskStatus).toBeDefined();
			});
		});

		describe('when board contains a lesson', () => {
			const setup = () => {
				const originalLesson = lessonFactory.buildWithId();
				const lessonElement = lessonBoardElementFactory.buildWithId({ target: originalLesson });
				const destinationCourse = courseFactory.buildWithId();
				const originalBoard = boardFactory.buildWithId({ references: [lessonElement], course: destinationCourse });
				const user = userFactory.buildWithId();
				const lessonCopy = lessonFactory.buildWithId({ name: originalLesson.name });

				lessonCopyService.copyLesson.mockResolvedValue({
					title: originalLesson.name,
					type: CopyElementType.LESSON,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: lessonCopy,
				});
				lessonCopyService.updateCopiedEmbeddedTasks = jest.fn().mockImplementation((status: CopyStatus) => status);

				return { destinationCourse, originalBoard, user, originalLesson };
			};

			it('should call lessonCopyService with original lesson', async () => {
				const { destinationCourse, originalBoard, user, originalLesson } = setup();

				const expected = {
					originalLessonId: originalLesson.id,
					destinationCourse,
					user,
				};

				await copyService.copyBoard({ originalBoard, user, originalCourse: destinationCourse, destinationCourse });
				expect(lessonCopyService.copyLesson).toHaveBeenCalledWith(expected);
			});

			it('should add lessonCopy to board copy', async () => {
				const { destinationCourse, originalBoard, user } = setup();
				const status = await copyService.copyBoard({
					originalBoard,
					user,
					originalCourse: destinationCourse,
					destinationCourse,
				});
				const board = status.copyEntity as LegacyBoard;

				expect(board.getElements().length).toEqual(1);
			});

			it('should add status of lessonCopy to board copy status', async () => {
				const { destinationCourse, originalBoard, user } = setup();
				const status = await copyService.copyBoard({
					originalBoard,
					user,
					originalCourse: destinationCourse,
					destinationCourse,
				});
				const lessonStatus = status.elements?.find((el) => el.type === CopyElementType.LESSON);

				expect(lessonStatus).toBeDefined();
			});
		});

		describe('when board contains column board', () => {
			const setup = () => {
				const originalColumnBoard = columnBoardFactory.build();
				const columnBoardTarget = columnBoardNodeFactory.build({
					title: originalColumnBoard.title,
				});
				const columBoardElement = columnboardBoardElementFactory.build({ target: columnBoardTarget });
				const destinationCourse = courseFactory.buildWithId();
				const originalBoard = boardFactory.buildWithId({ references: [columBoardElement], course: destinationCourse });
				const user = userFactory.buildWithId();
				const copyOfColumnBoard = columnBoardFactory.build();

				columnBoardService.copyColumnBoard.mockResolvedValue({
					type: CopyElementType.COLUMNBOARD,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: copyOfColumnBoard,
					originalEntity: originalColumnBoard,
					title: copyOfColumnBoard.title,
				});

				return { destinationCourse, originalBoard, user, originalColumnBoard, columnBoardTarget };
			};

			it('should call columnBoardCopyService with original columnBoard', async () => {
				const { destinationCourse, originalBoard, user, columnBoardTarget } = setup();

				const expected: CopyColumnBoardParams = {
					originalColumnBoardId: columnBoardTarget.id,
					targetExternalReference: {
						type: BoardExternalReferenceType.Course,
						id: destinationCourse.id,
					},
					sourceStorageLocationReference: { id: destinationCourse.school.id, type: StorageLocation.SCHOOL },
					targetStorageLocationReference: { id: destinationCourse.school.id, type: StorageLocation.SCHOOL },
					userId: user.id,
					targetSchoolId: user.school.id,
				};

				await copyService.copyBoard({ originalBoard, user, originalCourse: destinationCourse, destinationCourse });
				expect(columnBoardService.copyColumnBoard).toHaveBeenCalledWith(expected);
			});

			it('should add columnBoard copy to board copy', async () => {
				const { destinationCourse, originalBoard, user } = setup();
				const status = await copyService.copyBoard({
					originalBoard,
					originalCourse: destinationCourse,
					user,
					destinationCourse,
				});
				const board = status.copyEntity as LegacyBoard;

				expect(board.getElements().length).toEqual(1);
			});

			it('should add status of columnBoard copy to board copy status', async () => {
				const { destinationCourse, originalBoard, user } = setup();
				const status = await copyService.copyBoard({
					originalBoard,
					originalCourse: destinationCourse,
					user,
					destinationCourse,
				});
				const lessonStatus = status.elements?.find((el) => el.type === CopyElementType.COLUMNBOARD);

				expect(lessonStatus).toBeDefined();
			});
		});

		describe('when different elements have been copied', () => {
			const setup = () => {
				const originalTask = taskFactory.buildWithId();
				const taskElement = taskBoardElementFactory.buildWithId({ target: originalTask });
				const taskCopy = taskFactory.buildWithId({ name: originalTask.name });
				taskCopyService.copyTask.mockResolvedValue({
					title: taskCopy.name,
					type: CopyElementType.TASK,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: taskCopy,
				});

				const originalLesson = lessonFactory.buildWithId();
				const lessonElement = lessonBoardElementFactory.buildWithId({ target: originalLesson });
				const lessonCopy = lessonFactory.buildWithId({ name: originalLesson.name });
				lessonCopyService.copyLesson.mockResolvedValue({
					title: originalLesson.name,
					type: CopyElementType.LESSON,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: lessonCopy,
				});
				lessonCopyService.updateCopiedEmbeddedTasks = jest.fn().mockImplementation((status: CopyStatus) => status);

				const originalColumnBoard = columnBoardFactory.build();
				const columnBoardTarget = columnBoardNodeFactory.build({
					title: originalColumnBoard.title,
				});
				columnBoardTarget.id = originalColumnBoard.id;
				const columnBoardElement = columnboardBoardElementFactory.buildWithId({ target: columnBoardTarget });
				const columnBoardCopy = columnBoardFactory.build();
				columnBoardService.copyColumnBoard.mockResolvedValue({
					type: CopyElementType.COLUMNBOARD,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: columnBoardCopy,
					originalEntity: originalColumnBoard,
					title: columnBoardCopy.title,
				});

				const copyDict = new Map<EntityId, AuthorizableObject>()
					.set(originalLesson.id, lessonCopy)
					.set(originalTask.id, taskCopy)
					.set(originalColumnBoard.id, columnBoardCopy);
				copyHelperService.buildCopyEntityDict.mockReturnValue(copyDict);

				const originalCourse = courseFactory.buildWithId();
				const destinationCourse = courseFactory.buildWithId();
				const originalBoard = boardFactory.buildWithId({
					references: [lessonElement, taskElement, columnBoardElement],
					course: originalCourse,
				});
				const user = userFactory.buildWithId();

				return {
					originalCourse,
					destinationCourse,
					originalBoard,
					user,
					lessonCopy,
					columnBoardCopy,
					originalTask,
					taskCopy,
					originalLesson,
				};
			};

			it('should trigger swapping ids for board', async () => {
				const { destinationCourse, originalBoard, user, columnBoardCopy } = setup();
				await copyService.copyBoard({ originalBoard, user, originalCourse: destinationCourse, destinationCourse });

				expect(columnBoardService.swapLinkedIds).toHaveBeenCalledWith(columnBoardCopy.id, expect.anything());
			});

			it('should pass task for swapping ids', async () => {
				const { destinationCourse, originalBoard, user, originalTask, taskCopy } = setup();
				await copyService.copyBoard({ originalBoard, user, originalCourse: destinationCourse, destinationCourse });

				const map = columnBoardService.swapLinkedIds.mock.calls[0][1];
				expect(map.get(originalTask.id)).toEqual(taskCopy.id);
			});

			it('should pass lesson for swapping ids', async () => {
				const { destinationCourse, originalBoard, user, originalLesson, lessonCopy } = setup();
				await copyService.copyBoard({ originalBoard, user, originalCourse: destinationCourse, destinationCourse });

				const map = columnBoardService.swapLinkedIds.mock.calls[0][1];
				expect(map.get(originalLesson.id)).toEqual(lessonCopy.id);
			});

			it('should pass course for swapping ids', async () => {
				const { originalCourse, destinationCourse, originalBoard, user } = setup();
				await copyService.copyBoard({ originalBoard, user, originalCourse: destinationCourse, destinationCourse });

				const map = columnBoardService.swapLinkedIds.mock.calls[0][1];
				expect(map.get(originalCourse.id)).toEqual(destinationCourse.id);
			});
		});

		describe('derive status from elements', () => {
			const setup = () => {
				const originalTask = taskFactory.build();
				const taskElement = taskBoardElementFactory.build({ target: originalTask });
				const taskCopy = taskFactory.build({ name: originalTask.name });

				const originalLesson = lessonFactory.build();
				const lessonElement = lessonBoardElementFactory.build({ target: originalLesson });
				const lessonCopy = lessonFactory.build({ name: originalLesson.name });

				const destinationCourse = courseFactory.build();
				const originalBoard = boardFactory.build({
					references: [lessonElement, taskElement],
					course: destinationCourse,
				});
				const user = userFactory.build();

				return { destinationCourse, originalBoard, user, taskCopy, lessonCopy };
			};

			it('should call deriveStatusFromElements', async () => {
				const { destinationCourse, originalBoard, user } = setup();
				await copyService.copyBoard({ originalBoard, user, originalCourse: destinationCourse, destinationCourse });

				expect(copyHelperService.deriveStatusFromElements).toHaveBeenCalled();
			});

			it('should use returned value from deriveStatusFromElements', async () => {
				const { destinationCourse, originalBoard, user } = setup();
				copyHelperService.deriveStatusFromElements.mockReturnValue(CopyStatusEnum.PARTIAL);
				const status = await copyService.copyBoard({
					originalBoard,
					user,
					originalCourse: destinationCourse,
					destinationCourse,
				});

				expect(status.status).toEqual(CopyStatusEnum.PARTIAL);
			});
		});

		describe('when board contains corrupted references', () => {
			const setup = () => {
				const originalLesson = lessonFactory.buildWithId();
				const lessonElement = lessonBoardElementFactory.buildWithId({ target: originalLesson });
				const destinationCourse = courseFactory.buildWithId();
				const originalBoard = boardFactory.buildWithId({ references: [lessonElement], course: destinationCourse });
				const user = userFactory.buildWithId();
				const lessonCopy = lessonFactory.buildWithId({ name: originalLesson.name });

				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				delete originalBoard.references[0].target;

				lessonCopyService.copyLesson.mockResolvedValue({
					title: originalLesson.name,
					type: CopyElementType.LESSON,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: lessonCopy,
				});
				lessonCopyService.updateCopiedEmbeddedTasks = jest.fn().mockImplementation((status: CopyStatus) => status);

				return { destinationCourse, originalBoard, user, originalLesson };
			};

			it('should skip boardelements that contain a corrupted reference', async () => {
				const { destinationCourse, originalBoard, user } = setup();

				const status = await copyService.copyBoard({
					originalBoard,
					user,
					originalCourse: destinationCourse,
					destinationCourse,
				});
				const board = status.copyEntity as LegacyBoard;

				expect(board.references).toHaveLength(0);
			});
		});

		describe('when persist fails', () => {
			const setup = () => {
				const originalLesson = lessonFactory.buildWithId();
				const lessonElement = lessonBoardElementFactory.buildWithId({ target: originalLesson });
				const destinationCourse = courseFactory.buildWithId();
				const originalBoard = boardFactory.buildWithId({ references: [lessonElement], course: destinationCourse });
				const user = userFactory.buildWithId();
				const lessonCopy = lessonFactory.buildWithId({ name: originalLesson.name });

				lessonCopyService.copyLesson.mockResolvedValue({
					title: originalLesson.name,
					type: CopyElementType.LESSON,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: lessonCopy,
				});
				lessonCopyService.updateCopiedEmbeddedTasks = jest.fn().mockImplementation((status: CopyStatus) => status);
				boardRepo.save.mockRejectedValue(new Error());

				return { destinationCourse, originalBoard, user, originalLesson };
			};

			it('should return status fail', async () => {
				const { destinationCourse, originalBoard, user } = setup();

				const status = await copyService.copyBoard({
					originalBoard,
					user,
					originalCourse: destinationCourse,
					destinationCourse,
				});

				expect(status.status).toEqual(CopyStatusEnum.FAIL);
			});
		});
	});
});
