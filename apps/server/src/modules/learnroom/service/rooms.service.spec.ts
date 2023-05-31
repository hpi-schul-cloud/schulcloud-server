import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardRepo, LessonRepo } from '@shared/repo';
import { boardFactory, courseFactory, lessonFactory, setupEntities, taskFactory, userFactory } from '@shared/testing';
import { ColumnBoardService } from '@src/modules/board';
import { TaskService } from '@src/modules/task/service';
import { RoomsService } from './rooms.service';

describe('rooms service', () => {
	let module: TestingModule;
	let roomsService: RoomsService;
	let lessonRepo: DeepMocked<LessonRepo>;
	let taskService: DeepMocked<TaskService>;
	let boardRepo: DeepMocked<BoardRepo>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			imports: [],
			providers: [
				RoomsService,
				{
					provide: LessonRepo,
					useValue: createMock<LessonRepo>(),
				},
				{
					provide: TaskService,
					useValue: createMock<TaskService>(),
				},
				{
					provide: BoardRepo,
					useValue: createMock<BoardRepo>(),
				},
				{
					provide: ColumnBoardService,
					useValue: createMock<ColumnBoardService>(),
				},
				{
					provide: EntityManager,
					useValue: createMock<EntityManager>(),
				},
			],
		}).compile();
		roomsService = module.get(RoomsService);
		lessonRepo = module.get(LessonRepo);
		taskService = module.get(TaskService);
		boardRepo = module.get(BoardRepo);
	});

	describe('updateBoard', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const room = courseFactory.buildWithId({ students: [user] });
			const tasks = taskFactory.buildList(3, { course: room });
			const lessons = lessonFactory.buildList(3, { course: room });
			const board = boardFactory.buildWithId({ course: room });

			board.syncBoardElementReferences([...tasks, ...lessons]);

			const tasksSpy = taskService.findBySingleParent.mockResolvedValue([tasks, 3]);
			const lessonsSpy = lessonRepo.findAllByCourseIds.mockResolvedValue([lessons, 3]);
			const syncBoardElementReferencesSpy = jest.spyOn(board, 'syncBoardElementReferences');
			const saveSpy = boardRepo.save.mockResolvedValue();

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
			await roomsService.updateBoard(board, room.id, user.id);
			expect(lessonsSpy).toHaveBeenCalledWith([room.id]);
		});

		it('should fetch all tasks of room', async () => {
			const { board, room, user, tasksSpy } = setup();
			await roomsService.updateBoard(board, room.id, user.id);
			expect(tasksSpy).toHaveBeenCalledWith(user.id, room.id);
		});

		it('should sync boards lessons with fetched tasks and lessons', async () => {
			const { board, room, user, tasks, lessons, syncBoardElementReferencesSpy } = setup();
			await roomsService.updateBoard(board, room.id, user.id);
			expect(syncBoardElementReferencesSpy).toHaveBeenCalledWith([...lessons, ...tasks]);
		});

		it('should persist board', async () => {
			const { board, room, user, saveSpy } = setup();
			await roomsService.updateBoard(board, room.id, user.id);
			expect(saveSpy).toHaveBeenCalledWith(board);
		});
	});
});
