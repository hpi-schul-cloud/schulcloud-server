import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
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
import { TaskCopyService } from '..';
import { CopyElementType, CopyStatusEnum } from '../types';
import { BoardCopyService } from './board-copy.service';
import { LessonCopyService } from './lesson-copy.service';

describe('board copy service', () => {
	let module: TestingModule;
	let copyService: BoardCopyService;
	let taskCopyService: DeepMocked<TaskCopyService>;
	let lessonCopyService: DeepMocked<LessonCopyService>;

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
			],
		}).compile();

		copyService = module.get(BoardCopyService);
		taskCopyService = module.get(TaskCopyService);
		lessonCopyService = module.get(LessonCopyService);
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

				const result = copyService.copyBoard({ originalBoard, user, destinationCourse });
				expect(result.status.type).toEqual(CopyElementType.BOARD);
			});

			it('should set title copy status to "board"', () => {
				const { destinationCourse, originalBoard, user } = setup();

				const result = copyService.copyBoard({ originalBoard, user, destinationCourse });
				expect(result.status.title).toEqual('board');
			});

			it('should create a copy', () => {
				const { destinationCourse, originalBoard, user } = setup();

				const result = copyService.copyBoard({ originalBoard, user, destinationCourse });
				expect(result.copy.id).not.toEqual(originalBoard.id);
			});

			it('should set destination course of copy', () => {
				const { destinationCourse, originalBoard, user } = setup();

				const result = copyService.copyBoard({ originalBoard, user, destinationCourse });
				expect(result.copy.course.id).toEqual(destinationCourse.id);
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
					copy: taskCopy,
					status: { title: taskCopy.name, type: CopyElementType.TASK, status: CopyStatusEnum.SUCCESS },
				});

				return { destinationCourse, originalBoard, user, originalTask };
			};

			it('should call taskCopyService with original task', () => {
				const { destinationCourse, originalBoard, user, originalTask } = setup();

				copyService.copyBoard({ originalBoard, user, destinationCourse });
				expect(taskCopyService.copyTaskMetadata).toHaveBeenCalledWith({ originalTask, destinationCourse, user });
			});

			it('should add copy of task to board copy', () => {
				const { destinationCourse, originalBoard, user } = setup();

				const result = copyService.copyBoard({ originalBoard, user, destinationCourse });
				expect(result.copy.getElements().length).toEqual(1);
			});

			it('should add status of copying task to board copy status', () => {
				const { destinationCourse, originalBoard, user, originalTask } = setup();

				const result = copyService.copyBoard({ originalBoard, user, destinationCourse });
				const taskStatus = result.status.elements?.find(
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

				lessonCopyService.copyLesson.mockReturnValue({
					status: { title: originalLesson.name, type: CopyElementType.LESSON, status: CopyStatusEnum.NOT_IMPLEMENTED },
				});

				return { destinationCourse, originalBoard, user, originalLesson };
			};

			it('should call lessonCopyService with original lesson', () => {
				const { destinationCourse, originalBoard, user, originalLesson } = setup();

				copyService.copyBoard({ originalBoard, user, destinationCourse });
				expect(lessonCopyService.copyLesson).toHaveBeenCalledWith({ originalLesson, destinationCourse, user });
			});

			it('should add status of copying lesson to board copy status', () => {
				const { destinationCourse, originalBoard, user, originalLesson } = setup();

				const result = copyService.copyBoard({ originalBoard, user, destinationCourse });
				const lessonStatus = result.status.elements?.find(
					(el) => el.type === CopyElementType.LESSON && el.title === originalLesson.name
				);
				expect(lessonStatus).toBeDefined();
			});
		});
	});
});
