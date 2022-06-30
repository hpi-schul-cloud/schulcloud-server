import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Board, BoardCopyService, CopyHelperService, LessonCopyService, TaskCopyService } from '@shared/domain';
import {
	boardFactory,
	courseFactory,
	lessonBoardElementFactory,
	lessonFactory,
	setupEntities,
	taskBoardElementFactory,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { CopyElementType, CopyStatusEnum } from '../types';

describe('board copy service', () => {
	let module: TestingModule;
	let copyService: BoardCopyService;
	let taskCopyService: DeepMocked<TaskCopyService>;
	let lessonCopyService: DeepMocked<LessonCopyService>;
	let copyHelperService: DeepMocked<CopyHelperService>;

	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
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
					provide: CopyHelperService,
					useValue: createMock<CopyHelperService>(),
				},
			],
		}).compile();

		copyService = module.get(BoardCopyService);
		taskCopyService = module.get(TaskCopyService);
		lessonCopyService = module.get(LessonCopyService);
		copyHelperService = module.get(CopyHelperService);
	});

	describe('copyBoard', () => {
		describe('when the board is empty', () => {
			const setup = () => {
				const destinationCourse = courseFactory.buildWithId();
				const originalBoard = boardFactory.buildWithId({ references: [], course: destinationCourse });
				const user = userFactory.build();

				return { destinationCourse, originalBoard, user };
			};

			it('should return copy type "board"', () => {
				const { destinationCourse, originalBoard, user } = setup();

				const status = copyService.copyBoard({ originalBoard, user, destinationCourse });
				expect(status.type).toEqual(CopyElementType.BOARD);
			});

			it('should set title copy status to "board"', () => {
				const { destinationCourse, originalBoard, user } = setup();

				const status = copyService.copyBoard({ originalBoard, user, destinationCourse });
				expect(status.title).toEqual('board');
			});

			it('should create a copy', () => {
				const { destinationCourse, originalBoard, user } = setup();

				const status = copyService.copyBoard({ originalBoard, user, destinationCourse });
				const board = status.copyEntity as Board;
				expect(board.id).not.toEqual(originalBoard.id);
			});

			it('should set destination course of copy', () => {
				const { destinationCourse, originalBoard, user } = setup();

				const status = copyService.copyBoard({ originalBoard, user, destinationCourse });
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

				taskCopyService.copyTaskMetadata.mockReturnValue({
					title: taskCopy.name,
					type: CopyElementType.TASK,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: taskCopy,
				});

				return { destinationCourse, originalBoard, user, originalTask };
			};

			it('should call taskCopyService with original task', () => {
				const { destinationCourse, originalBoard, user, originalTask } = setup();

				copyService.copyBoard({ originalBoard, user, destinationCourse });
				expect(taskCopyService.copyTaskMetadata).toHaveBeenCalledWith({ originalTask, destinationCourse, user });
			});

			it('should call copyHelperService', () => {
				const { destinationCourse, originalBoard, user } = setup();

				copyService.copyBoard({ originalBoard, user, destinationCourse });
				expect(copyHelperService.deriveStatusFromElements).toHaveBeenCalledTimes(1);
			});

			it('should add copy of task to board copy', () => {
				const { destinationCourse, originalBoard, user } = setup();

				const status = copyService.copyBoard({ originalBoard, user, destinationCourse });
				const board = status.copyEntity as Board;
				expect(board.getElements().length).toEqual(1);
			});

			it('should add status of copying task to board copy status', () => {
				const { destinationCourse, originalBoard, user, originalTask } = setup();

				const status = copyService.copyBoard({ originalBoard, user, destinationCourse });
				const taskStatus = status.elements?.find(
					(el) => el.type === CopyElementType.TASK && el.title === originalTask.name
				);
				expect(taskStatus).toBeDefined();
			});
		});

		describe('when board contains a lesson', () => {
			const setup = () => {
				const originalLesson = lessonFactory.build();
				const lessonElement = lessonBoardElementFactory.build({ target: originalLesson });
				const destinationCourse = courseFactory.build();
				const originalBoard = boardFactory.build({ references: [lessonElement], course: destinationCourse });
				const user = userFactory.build();
				const lessonCopy = taskFactory.build({ name: originalLesson.name });

				lessonCopyService.copyLesson.mockReturnValue({
					title: originalLesson.name,
					type: CopyElementType.LESSON,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: lessonCopy,
				});

				return { destinationCourse, originalBoard, user, originalLesson };
			};

			it('should call lessonCopyService with original lesson', () => {
				const { destinationCourse, originalBoard, user, originalLesson } = setup();

				copyService.copyBoard({ originalBoard, user, destinationCourse });
				expect(lessonCopyService.copyLesson).toHaveBeenCalledWith({ originalLesson, destinationCourse, user });
			});

			it('should add copy of lesson to board copy', () => {
				const { destinationCourse, originalBoard, user } = setup();

				const status = copyService.copyBoard({ originalBoard, user, destinationCourse });
				const board = status.copyEntity as Board;
				expect(board.getElements().length).toEqual(1);
			});

			it('should add status of copying lesson to board copy status', () => {
				const { destinationCourse, originalBoard, user, originalLesson } = setup();

				const status = copyService.copyBoard({ originalBoard, user, destinationCourse });
				const lessonStatus = status.elements?.find(
					(el) => el.type === CopyElementType.LESSON && el.title === originalLesson.name
				);
				expect(lessonStatus).toBeDefined();
			});
		});
	});
});
