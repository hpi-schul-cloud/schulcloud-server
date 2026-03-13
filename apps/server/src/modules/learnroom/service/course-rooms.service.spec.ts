import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BoardExternalReferenceType } from '@modules/board';
import { columnBoardEntityFactory } from '@modules/board/testing/entity/column-board-entity.factory';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { LessonService } from '@modules/lesson';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { lessonFactory } from '@modules/lesson/testing';
import { TaskService } from '@modules/task';
import { Submission, Task } from '@modules/task/repo';
import { taskFactory } from '@modules/task/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { ColumnBoardNodeRepo, LegacyBoard, LegacyBoardElement, LegacyBoardRepo } from '../repo';
import { boardFactory } from '../testing';
import { CourseRoomsService } from './course-rooms.service';

describe('rooms service', () => {
	let module: TestingModule;
	let roomsService: CourseRoomsService;
	let lessonService: DeepMocked<LessonService>;
	let taskService: DeepMocked<TaskService>;
	let legacyBoardRepo: DeepMocked<LegacyBoardRepo>;
	let columnBoardNodeRepo: DeepMocked<ColumnBoardNodeRepo>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		await setupEntities([
			User,
			CourseEntity,
			CourseGroupEntity,
			LessonEntity,
			Material,
			Task,
			Submission,
			LegacyBoard,
			LegacyBoardElement,
		]);
		module = await Test.createTestingModule({
			providers: [
				CourseRoomsService,
				{
					provide: LessonService,
					useValue: createMock<LessonService>(),
				},
				{
					provide: TaskService,
					useValue: createMock<TaskService>(),
				},
				{
					provide: LegacyBoardRepo,
					useValue: createMock<LegacyBoardRepo>(),
				},
				{
					provide: ColumnBoardNodeRepo,
					useValue: createMock<ColumnBoardNodeRepo>(),
				},
			],
		}).compile();
		roomsService = module.get(CourseRoomsService);
		lessonService = module.get(LessonService);
		taskService = module.get(TaskService);
		legacyBoardRepo = module.get(LegacyBoardRepo);
		columnBoardNodeRepo = module.get(ColumnBoardNodeRepo);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('updateLegacyBoard', () => {
		describe('for lessons, tasks and column boards', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const room = courseEntityFactory.buildWithId({ students: [user] });
				const tasks = taskFactory.buildList(3, { course: room });
				const lessons = lessonFactory.buildList(3, { course: room });
				const legacyBoard = boardFactory.buildWithId({ course: room });

				const columnBoardNode = columnBoardEntityFactory.build({
					context: { type: BoardExternalReferenceType.Course, id: room.id },
				});

				// TODO what is this doing here?
				legacyBoard.syncBoardElementReferences([...tasks, ...lessons, columnBoardNode]);

				const tasksSpy = taskService.findBySingleParent.mockResolvedValue([tasks, 3]);
				const lessonsSpy = lessonService.findByCourseIds.mockResolvedValue([lessons, 3]);

				columnBoardNodeRepo.findByExternalReference.mockResolvedValue([columnBoardNode]);

				const syncBoardElementReferencesSpy = jest.spyOn(legacyBoard, 'syncBoardElementReferences');
				const saveSpy = legacyBoardRepo.save.mockResolvedValue();

				return {
					user,
					board: legacyBoard,
					room,
					tasks,
					lessons,
					lessonsSpy,
					tasksSpy,
					syncBoardElementReferencesSpy,
					saveSpy,

					columnBoardNode,
				};
			};

			it('should fetch all lessons of room', async () => {
				const { board, room, user, lessonsSpy } = setup();
				await roomsService.updateLegacyBoard(board, room.id, user.id);
				expect(lessonsSpy).toHaveBeenCalledWith([room.id]);
			});

			it('should fetch all tasks of room', async () => {
				const { board, room, user, tasksSpy } = setup();
				await roomsService.updateLegacyBoard(board, room.id, user.id);
				expect(tasksSpy).toHaveBeenCalledWith(user.id, room.id);
			});

			it('should fetch all column boardIds for course', async () => {
				const { board, room, user } = setup();

				await roomsService.updateLegacyBoard(board, room.id, user.id);

				expect(columnBoardNodeRepo.findByExternalReference).toHaveBeenCalledWith({
					type: 'course',
					id: room.id,
				});
			});

			it('should sync legacy boards lessons with fetched tasks and lessons and columnBoards', async () => {
				const { board, room, user, tasks, lessons, columnBoardNode, syncBoardElementReferencesSpy } = setup();
				await roomsService.updateLegacyBoard(board, room.id, user.id);
				expect(syncBoardElementReferencesSpy).toHaveBeenCalledWith([...lessons, ...tasks, columnBoardNode]);
			});

			it('should persist board', async () => {
				const { board, room, user, saveSpy } = setup();
				await roomsService.updateLegacyBoard(board, room.id, user.id);
				expect(saveSpy).toHaveBeenCalledWith(board);
			});
		});
	});
});
