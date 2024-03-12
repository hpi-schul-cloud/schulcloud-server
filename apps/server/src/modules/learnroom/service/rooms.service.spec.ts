import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { IConfig } from '@hpi-schul-cloud/commons/lib/interfaces/IConfig';
import { CardService, ColumnBoardService, ColumnService, ContentElementService } from '@modules/board';
import { LessonService } from '@modules/lesson';
import { TaskService } from '@modules/task';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacyBoardRepo } from '@shared/repo';
import {
	boardFactory,
	courseFactory,
	lessonFactory,
	setupEntities,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { ColumnBoardNode } from '@shared/domain/entity';
import { BoardNodeRepo } from '@modules/board/repo';
import { RoomsService } from './rooms.service';

describe('rooms service', () => {
	let module: TestingModule;
	let roomsService: RoomsService;
	let lessonService: DeepMocked<LessonService>;
	let taskService: DeepMocked<TaskService>;
	let legacyBoardRepo: DeepMocked<LegacyBoardRepo>;
	let columnBoardService: DeepMocked<ColumnBoardService>;
	let configBefore: IConfig;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		configBefore = Configuration.toObject({ plainSecrets: true });
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				RoomsService,
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
					provide: ColumnBoardService,
					useValue: createMock<ColumnBoardService>(),
				},
				{
					provide: ColumnService,
					useValue: createMock<ColumnService>(),
				},
				{
					provide: CardService,
					useValue: createMock<CardService>(),
				},
				{
					provide: ContentElementService,
					useValue: createMock<ContentElementService>(),
				},
				{
					provide: ColumnBoardNode,
					useValue: createMock<ColumnBoardNode>(),
				},
				{
					provide: BoardNodeRepo,
					useValue: createMock<BoardNodeRepo>(),
				},
			],
		}).compile();
		roomsService = module.get(RoomsService);
		lessonService = module.get(LessonService);
		taskService = module.get(TaskService);
		legacyBoardRepo = module.get(LegacyBoardRepo);
		columnBoardService = module.get(ColumnBoardService);
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
				const board = boardFactory.buildWithId({ course: room });

				board.syncBoardElementReferences([...tasks, ...lessons]);

				const tasksSpy = taskService.findBySingleParent.mockResolvedValue([tasks, 3]);
				const lessonsSpy = lessonService.findByCourseIds.mockResolvedValue([lessons, 3]);

				const syncBoardElementReferencesSpy = jest.spyOn(board, 'syncBoardElementReferences');
				const saveSpy = legacyBoardRepo.save.mockResolvedValue();

				return {
					user,
					board,
					room,
					tasks,
					lessons,
					lessonsSpy,
					tasksSpy,
					syncBoardElementReferencesSpy,
					saveSpy,
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

			it('should fetch all column boards', async () => {
				const { board, room, user } = setup();

				await roomsService.updateLegacyBoard(board, room.id, user.id);

				expect(columnBoardService.findIdsByExternalReference).toHaveBeenCalledWith({
					type: 'course',
					id: room.id,
				});
			});

			it('should sync boards lessons with fetched tasks and lessons', async () => {
				const { board, room, user, tasks, lessons, columnBoardTarget, syncBoardElementReferencesSpy } = setup();
				await roomsService.updateLegacyBoard(board, room.id, user.id);
				expect(syncBoardElementReferencesSpy).toHaveBeenCalledWith([...lessons, ...tasks, columnBoardTarget]);
			});

			it('should persist board', async () => {
				const { board, room, user, saveSpy } = setup();
				await roomsService.updateLegacyBoard(board, room.id, user.id);
				expect(saveSpy).toHaveBeenCalledWith(board);
			});
		});
	});
});
