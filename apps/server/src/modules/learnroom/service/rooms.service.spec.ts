import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardRepo, LessonRepo, TaskRepo } from '@shared/repo';
import { boardFactory, courseFactory, lessonFactory, setupEntities, taskFactory, userFactory } from '@shared/testing';
import { RoomsService } from './rooms.service';

describe('rooms service', () => {
	let module: TestingModule;
	let roomsService: RoomsService;
	let lessonRepo: DeepMocked<LessonRepo>;
	let taskRepo: DeepMocked<TaskRepo>;
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
					provide: TaskRepo,
					useValue: createMock<TaskRepo>(),
				},
				{
					provide: BoardRepo,
					useValue: createMock<BoardRepo>(),
				},
			],
		}).compile();
		roomsService = module.get(RoomsService);
		lessonRepo = module.get(LessonRepo);
		taskRepo = module.get(TaskRepo);
		boardRepo = module.get(BoardRepo);
	});

	describe('updateBoard', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const room = courseFactory.buildWithId({ students: [user] });
			const tasks = taskFactory.buildList(3, { course: room });
			const lessons = lessonFactory.buildList(3, { course: room });
			const board = boardFactory.buildWithId({ course: room });

			board.syncLessonsFromList(lessons);
			board.syncTasksFromList(tasks);

			const tasksSpy = taskRepo.findBySingleParent.mockResolvedValue([tasks, 3]);
			const lessonsSpy = lessonRepo.findAllByCourseIds.mockResolvedValue([lessons, 3]);
			const syncLessonsSpy = jest.spyOn(board, 'syncLessonsFromList');
			const syncTasksSpy = jest.spyOn(board, 'syncTasksFromList');
			const saveSpy = boardRepo.save.mockResolvedValue();

			return {
				user,
				board,
				room,
				tasks,
				lessons,
				lessonsSpy,
				tasksSpy,
				syncLessonsSpy,
				syncTasksSpy,
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

		it('should sync boards lessons with fetched lessons', async () => {
			const { board, room, user, lessons, syncLessonsSpy } = setup();
			await roomsService.updateBoard(board, room.id, user.id);
			expect(syncLessonsSpy).toHaveBeenCalledWith(lessons);
		});

		it('should sync boards tasks with fetched tasks', async () => {
			const { board, room, user, tasks, syncTasksSpy } = setup();
			await roomsService.updateBoard(board, room.id, user.id);
			expect(syncTasksSpy).toHaveBeenCalledWith(tasks);
		});

		it('should persist board', async () => {
			const { board, room, user, saveSpy } = setup();
			await roomsService.updateBoard(board, room.id, user.id);
			expect(saveSpy).toHaveBeenCalledWith(board);
		});
	});
});
