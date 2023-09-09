import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Board } from '@shared/domain';
import { BoardExternalReferenceType } from '@shared/domain/domainobject/board/types';
import { BoardRepo } from '@shared/repo';
import {
	boardFactory,
	columnboardBoardElementFactory,
	columnBoardFactory,
	columnBoardTargetFactory,
	courseFactory,
	lessonBoardElementFactory,
	lessonFactory,
	setupEntities,
	taskBoardElementFactory,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { ColumnBoardCopyService } from '@src/modules/board/service/column-board-copy.service';
import { CopyElementType, CopyHelperService, CopyStatus, CopyStatusEnum } from '@src/modules/copy-helper';
import { LessonCopyService } from '@src/modules/lesson/service';
import { TaskCopyService } from '@src/modules/task/service';
import { BoardCopyService } from './board-copy.service';

describe('board copy service', () => {
	let module: TestingModule;
	let copyService: BoardCopyService;
	let taskCopyService: DeepMocked<TaskCopyService>;
	let lessonCopyService: DeepMocked<LessonCopyService>;
	let columnBoardCopyService: DeepMocked<ColumnBoardCopyService>;
	let copyHelperService: DeepMocked<CopyHelperService>;
	let boardRepo: DeepMocked<BoardRepo>;

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
					provide: ColumnBoardCopyService,
					useValue: createMock<ColumnBoardCopyService>(),
				},
				{
					provide: CopyHelperService,
					useValue: createMock<CopyHelperService>(),
				},
				{
					provide: BoardRepo,
					useValue: createMock<BoardRepo>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		copyService = module.get(BoardCopyService);
		taskCopyService = module.get(TaskCopyService);
		lessonCopyService = module.get(LessonCopyService);
		copyHelperService = module.get(CopyHelperService);
		columnBoardCopyService = module.get(ColumnBoardCopyService);
		boardRepo = module.get(BoardRepo);
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

				const status = await copyService.copyBoard({ originalBoard, user, destinationCourse });
				expect(status.type).toEqual(CopyElementType.BOARD);
			});

			it('should set title copy status to "board"', async () => {
				const { destinationCourse, originalBoard, user } = setup();

				const status = await copyService.copyBoard({ originalBoard, user, destinationCourse });
				expect(status.title).toEqual('board');
			});

			it('should set original entity in status', async () => {
				const { destinationCourse, originalBoard, user } = setup();

				const status = await copyService.copyBoard({ originalBoard, user, destinationCourse });
				expect(status.originalEntity).toEqual(originalBoard);
			});

			it('should create a copy', async () => {
				const { destinationCourse, originalBoard, user } = setup();

				const status = await copyService.copyBoard({ originalBoard, user, destinationCourse });
				const board = status.copyEntity as Board;
				expect(board.id).not.toEqual(originalBoard.id);
			});

			it('should set destination course of copy', async () => {
				const { destinationCourse, originalBoard, user } = setup();

				const status = await copyService.copyBoard({ originalBoard, user, destinationCourse });
				const board = status.copyEntity as Board;
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

				await copyService.copyBoard({ originalBoard, user, destinationCourse });
				expect(taskCopyService.copyTask).toHaveBeenCalledWith({
					originalTaskId: originalTask.id,
					destinationCourse,
					user,
				});
			});

			it('should call copyHelperService', async () => {
				const { destinationCourse, originalBoard, user } = setup();

				await copyService.copyBoard({ originalBoard, user, destinationCourse });
				expect(copyHelperService.deriveStatusFromElements).toHaveBeenCalledTimes(1);
			});

			it('should add copy of task to board copy', async () => {
				const { destinationCourse, originalBoard, user } = setup();

				const status = await copyService.copyBoard({ originalBoard, user, destinationCourse });
				const board = status.copyEntity as Board;
				expect(board.getElements().length).toEqual(1);
			});

			it('should add status of copying task to board copy status', async () => {
				const { destinationCourse, originalBoard, user, originalTask } = setup();

				const status = await copyService.copyBoard({ originalBoard, user, destinationCourse });
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

				await copyService.copyBoard({ originalBoard, user, destinationCourse });
				expect(lessonCopyService.copyLesson).toHaveBeenCalledWith(expected);
			});

			it('should add lessonCopy to board copy', async () => {
				const { destinationCourse, originalBoard, user } = setup();
				const status = await copyService.copyBoard({ originalBoard, user, destinationCourse });
				const board = status.copyEntity as Board;

				expect(board.getElements().length).toEqual(1);
			});

			it('should add status of lessonCopy to board copy status', async () => {
				const { destinationCourse, originalBoard, user } = setup();
				const status = await copyService.copyBoard({ originalBoard, user, destinationCourse });
				const lessonStatus = status.elements?.find((el) => el.type === CopyElementType.LESSON);

				expect(lessonStatus).toBeDefined();
			});
		});

		describe('when board contains column board', () => {
			const setup = () => {
				const originalColumnBoard = columnBoardFactory.build();
				const columnBoardTarget = columnBoardTargetFactory.build({
					columnBoardId: originalColumnBoard.id,
					title: originalColumnBoard.title,
				});
				const columBoardElement = columnboardBoardElementFactory.build({ target: columnBoardTarget });
				const destinationCourse = courseFactory.buildWithId();
				const originalBoard = boardFactory.buildWithId({ references: [columBoardElement], course: destinationCourse });
				const user = userFactory.buildWithId();
				const copyOfColumnBoard = columnBoardFactory.build();

				columnBoardCopyService.copyColumnBoard.mockResolvedValue({
					type: CopyElementType.COLUMNBOARD,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: copyOfColumnBoard,
					originalEntity: originalColumnBoard,
					title: copyOfColumnBoard.title,
				});

				return { destinationCourse, originalBoard, user, originalColumnBoard };
			};

			it('should call columnBoardCopyService with original columnBoard', async () => {
				const { destinationCourse, originalBoard, user, originalColumnBoard } = setup();

				const expected = {
					originalColumnBoardId: originalColumnBoard.id,
					destinationExternalReference: {
						type: BoardExternalReferenceType.Course,
						id: destinationCourse.id,
					},
					userId: user.id,
				};

				await copyService.copyBoard({ originalBoard, user, destinationCourse });
				expect(columnBoardCopyService.copyColumnBoard).toHaveBeenCalledWith(expected);
			});

			it('should add columnBoard copy to board copy', async () => {
				const { destinationCourse, originalBoard, user } = setup();
				const status = await copyService.copyBoard({ originalBoard, user, destinationCourse });
				const board = status.copyEntity as Board;

				expect(board.getElements().length).toEqual(1);
			});

			it('should add status of columnBoard copy to board copy status', async () => {
				const { destinationCourse, originalBoard, user } = setup();
				const status = await copyService.copyBoard({ originalBoard, user, destinationCourse });
				const lessonStatus = status.elements?.find((el) => el.type === CopyElementType.COLUMNBOARD);

				expect(lessonStatus).toBeDefined();
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
				await copyService.copyBoard({ originalBoard, user, destinationCourse });

				expect(copyHelperService.deriveStatusFromElements).toHaveBeenCalled();
			});

			it('should use returned value from deriveStatusFromElements', async () => {
				const { destinationCourse, originalBoard, user } = setup();
				copyHelperService.deriveStatusFromElements.mockReturnValue(CopyStatusEnum.PARTIAL);
				const status = await copyService.copyBoard({ originalBoard, user, destinationCourse });

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

				const status = await copyService.copyBoard({ originalBoard, user, destinationCourse });
				const board = status.copyEntity as Board;

				expect(board.references).toHaveLength(0);
			});
		});
	});
});
