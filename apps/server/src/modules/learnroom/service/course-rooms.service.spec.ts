import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { IConfig } from '@hpi-schul-cloud/commons/lib/interfaces/IConfig';
import { LessonService } from '@modules/lesson';
import { TaskService } from '@modules/task';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacyBoardRepo } from '@shared/repo';
import {
	boardFactory,
	columnBoardNodeFactory,
	courseFactory,
	lessonFactory,
	setupEntities,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { ColumnBoardNodeRepo } from '../repo';
import { CourseRoomsService } from './course-rooms.service';

describe('rooms service', () => {
	let module: TestingModule;
	let roomsService: CourseRoomsService;
	let lessonService: DeepMocked<LessonService>;
	let taskService: DeepMocked<TaskService>;
	let legacyBoardRepo: DeepMocked<LegacyBoardRepo>;
	let columnBoardNodeRepo: DeepMocked<ColumnBoardNodeRepo>;
	let configBefore: IConfig;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		configBefore = Configuration.toObject({ plainSecrets: true });
		await setupEntities();
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
		Configuration.reset(configBefore);
	});

	describe('updateLegacyBoard', () => {
		describe('for lessons, tasks and column boards', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const room = courseFactory.buildWithId({ students: [user] });
				const tasks = taskFactory.buildList(3, { course: room });
				const lessons = lessonFactory.buildList(3, { course: room });
				const legacyBoard = boardFactory.buildWithId({ course: room });

				const columnBoardNode = columnBoardNodeFactory.build();

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
