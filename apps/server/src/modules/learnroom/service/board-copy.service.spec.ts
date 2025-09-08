import { LegacyLogger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { StorageLocation } from '@infra/files-storage-client';
import { ColumnBoardService } from '@modules/board';
import { BoardExternalReferenceType } from '@modules/board/domain';
import { CopyColumnBoardParams } from '@modules/board/service/internal';
import { columnBoardFactory } from '@modules/board/testing';
import { CopyElementType, CopyHelperService, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { LessonCopyService } from '@modules/lesson';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { lessonFactory } from '@modules/lesson/testing';
import { TaskCopyService } from '@modules/task';
import { Submission, Task } from '@modules/task/repo';
import { taskFactory } from '@modules/task/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { ColumnBoardNodeRepo, LegacyBoard, LegacyBoardElement, LegacyBoardRepo } from '../repo';
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
		await setupEntities([
			User,
			CourseEntity,
			CourseGroupEntity,
			Task,
			Submission,
			LessonEntity,
			Material,
			LegacyBoard,
			LegacyBoardElement,
		]);

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
		jest.spyOn(boardRepo, 'save').mockImplementation();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('copyBoard', () => {
		describe('when the board is empty', () => {
			const setup = () => {
				const destinationCourse = courseEntityFactory.buildWithId();
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
				const destinationCourse = courseEntityFactory.build();
				const originalBoard = boardFactory.build({ references: [taskElement], course: destinationCourse });
				const user = userFactory.build();
				const taskCopy = taskFactory.build({ name: originalTask.name });

				const taskCopyStatus: CopyStatus = {
					title: taskCopy.name,
					type: CopyElementType.TASK,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: taskCopy,
				};
				taskCopyService.copyTask.mockResolvedValueOnce(taskCopyStatus);

				const copyStatus: CopyStatus = {
					title: 'board',
					type: CopyElementType.BOARD,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: originalBoard,
					originalEntity: originalBoard,
					elements: [taskCopyStatus],
				};
				columnBoardService.swapLinkedIdsInBoards.mockResolvedValueOnce(copyStatus);
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
				const destinationCourse = courseEntityFactory.buildWithId();
				const originalBoard = boardFactory.buildWithId({ references: [lessonElement], course: destinationCourse });
				const user = userFactory.buildWithId();
				const lessonCopy = lessonFactory.buildWithId({ name: originalLesson.name });
				const lessonCopyStatus: CopyStatus = {
					title: originalLesson.name,
					type: CopyElementType.LESSON,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: lessonCopy,
				};
				lessonCopyService.copyLesson.mockResolvedValueOnce(lessonCopyStatus);

				const copyStatus: CopyStatus = {
					title: 'board',
					type: CopyElementType.BOARD,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: originalBoard,
					originalEntity: originalBoard,
					elements: [lessonCopyStatus],
				};
				columnBoardService.swapLinkedIdsInBoards.mockResolvedValueOnce(copyStatus);

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
				const destinationCourse = courseEntityFactory.buildWithId();
				const originalBoard = boardFactory.buildWithId({ references: [columBoardElement], course: destinationCourse });
				const user = userFactory.buildWithId();
				const copyOfColumnBoard = columnBoardFactory.build();

				const columnBoardCopyStatus: CopyStatus = {
					type: CopyElementType.COLUMNBOARD,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: copyOfColumnBoard,
					originalEntity: originalColumnBoard,
					title: copyOfColumnBoard.title,
				};
				columnBoardService.copyColumnBoard.mockResolvedValueOnce(columnBoardCopyStatus);

				const copyStatus: CopyStatus = {
					title: 'board',
					type: CopyElementType.BOARD,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: originalBoard,
					originalEntity: originalBoard,
					elements: [columnBoardCopyStatus],
				};
				columnBoardService.swapLinkedIdsInBoards.mockResolvedValueOnce(copyStatus);

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

		describe('derive status from elements', () => {
			const setup = () => {
				const originalTask = taskFactory.build();
				const taskElement = taskBoardElementFactory.build({ target: originalTask });
				const taskCopy = taskFactory.build({ name: originalTask.name });
				const taskCopyStatus: CopyStatus = {
					title: originalTask.name,
					type: CopyElementType.TASK,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: taskCopy,
				};
				taskCopyService.copyTask.mockResolvedValueOnce(taskCopyStatus);

				const originalLesson = lessonFactory.build();
				const lessonElement = lessonBoardElementFactory.build({ target: originalLesson });
				const lessonCopy = lessonFactory.build({ name: originalLesson.name });
				const lessonCopyStatus: CopyStatus = {
					title: originalLesson.name,
					type: CopyElementType.LESSON,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: lessonCopy,
				};
				lessonCopyService.copyLesson.mockResolvedValueOnce(lessonCopyStatus);

				const destinationCourse = courseEntityFactory.build();
				const originalBoard = boardFactory.build({
					references: [lessonElement, taskElement],
					course: destinationCourse,
				});

				copyHelperService.deriveStatusFromElements.mockReturnValueOnce(CopyStatusEnum.PARTIAL);

				const status: CopyStatus = {
					title: 'board',
					type: CopyElementType.BOARD,
					status: CopyStatusEnum.PARTIAL,
					copyEntity: originalBoard,
					originalEntity: originalBoard,
					elements: [lessonCopyStatus, taskCopyStatus],
				};
				columnBoardService.swapLinkedIdsInBoards.mockResolvedValueOnce(status);
				const user = userFactory.build();

				return { destinationCourse, originalBoard, user, taskCopy, lessonCopy, lessonCopyStatus, taskCopyStatus };
			};

			it('should call deriveStatusFromElements', async () => {
				const { destinationCourse, originalBoard, user } = setup();
				await copyService.copyBoard({ originalBoard, user, originalCourse: destinationCourse, destinationCourse });

				expect(copyHelperService.deriveStatusFromElements).toHaveBeenCalled();
			});

			it('should use returned value from deriveStatusFromElements', async () => {
				const { destinationCourse, originalBoard, user } = setup();
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
				const destinationCourse = courseEntityFactory.buildWithId();
				const originalBoard = boardFactory.buildWithId({ references: [lessonElement], course: destinationCourse });
				const user = userFactory.buildWithId();
				const lessonCopy = lessonFactory.buildWithId({ name: originalLesson.name });

				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				delete originalBoard.references[0].target;

				const lessonCopyStatus: CopyStatus = {
					title: originalLesson.name,
					type: CopyElementType.LESSON,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: lessonCopy,
				};
				lessonCopyService.copyLesson.mockResolvedValue(lessonCopyStatus);

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
				const destinationCourse = courseEntityFactory.buildWithId();
				const originalBoard = boardFactory.buildWithId({ references: [lessonElement], course: destinationCourse });
				const user = userFactory.buildWithId();
				const lessonCopy = lessonFactory.buildWithId({ name: originalLesson.name });
				const lessonCopyStatus: CopyStatus = {
					title: originalLesson.name,
					type: CopyElementType.LESSON,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: lessonCopy,
				};
				lessonCopyService.copyLesson.mockResolvedValue(lessonCopyStatus);

				const status: CopyStatus = {
					title: 'board',
					type: CopyElementType.BOARD,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: originalBoard,
					originalEntity: originalBoard,
					elements: [lessonCopyStatus],
				};
				columnBoardService.swapLinkedIdsInBoards.mockResolvedValue(status);

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
