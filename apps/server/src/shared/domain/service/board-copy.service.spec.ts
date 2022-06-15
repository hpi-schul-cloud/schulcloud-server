import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
	boardFactory,
	courseFactory,
	setupEntities,
	taskBoardElementFactory,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { TaskCopyService } from '..';
import { CopyElementType, CopyStatusEnum } from '../types';
import { BoardCopyService } from './board-copy.service';

describe('board copy service', () => {
	let module: TestingModule;
	let copyService: BoardCopyService;
	let taskCopyService: DeepMocked<TaskCopyService>;

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
			],
		}).compile();

		copyService = module.get(BoardCopyService);
		taskCopyService = module.get(TaskCopyService);
	});

	describe('copyBoard', () => {
		describe('when the board is empty', () => {
			const setup = () => {
				const destinationCourse = courseFactory.buildWithId();
				const originalBoard = boardFactory.buildWithId({ references: [], course: destinationCourse });
				const user = userFactory.buildWithId();

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
				const originalTask = taskFactory.buildWithId();
				const taskElement = taskBoardElementFactory.buildWithId({ target: originalTask });
				const destinationCourse = courseFactory.buildWithId();
				const originalBoard = boardFactory.buildWithId({ references: [taskElement], course: destinationCourse });
				const user = userFactory.buildWithId();
				const taskCopy = taskFactory.buildWithId();

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
		});
	});
});
