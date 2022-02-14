import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, lessonFactory, taskFactory, userFactory, boardFactory, setupEntities } from '@shared/testing';
import { Course, EntityId, User, Board } from '@shared/domain';
import { CourseRepo, LessonRepo, TaskRepo, UserRepo, BoardRepo } from '@shared/repo';
import { MikroORM } from '@mikro-orm/core';
import { RoomBoardDTO } from '../types';
import { RoomsUc } from './rooms.uc';
import { RoomBoardDTOMapper } from '../mapper/room-board-dto.mapper';

describe('rooms usecase', () => {
	let uc: RoomsUc;
	let courseRepo: CourseRepo;
	let lessonRepo: LessonRepo;
	let taskRepo: TaskRepo;
	let userRepo: UserRepo;
	let boardRepo: BoardRepo;
	let orm: MikroORM;
	let mapper: RoomBoardDTOMapper;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [],
			providers: [
				RoomsUc,
				{
					provide: CourseRepo,
					useValue: {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						findOne(courseId: EntityId, userId?: EntityId): Promise<Course> {
							throw new Error('Please write a mock for CourseRepo.findOne');
						},
					},
				},
				{
					provide: LessonRepo,
					useValue: {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						findAllByCourseIds(courseIds: EntityId[]) {
							throw new Error('Please write a mock for LessonRepo.findAllByCourseIds');
						},
					},
				},
				{
					provide: TaskRepo,
					useValue: {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						findBySingleParent(creatorId: EntityId, courseId: EntityId) {
							throw new Error('Please write a mock for TaskRepo.findBySingleParent');
						},
					},
				},
				{
					provide: UserRepo,
					useValue: {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						findById(id: EntityId, populateRoles?: boolean) {
							throw new Error('Please write a mock for UserRepo.findById');
						},
					},
				},
				{
					provide: BoardRepo,
					useValue: {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						save(board: Board): Promise<void> {
							throw new Error('Please write a mock for BoardRepo.save');
						},
					},
				},
				{
					provide: RoomBoardDTOMapper,
					useValue: {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						mapDTO({ room, board, user }: { room: Course; board: Board; user: User }): RoomBoardDTO {
							throw new Error('Please write a mock for RoomBoardDTOMapper.mapDTO');
						},
					},
				},
			],
		}).compile();

		uc = module.get(RoomsUc);
		courseRepo = module.get(CourseRepo);
		lessonRepo = module.get(LessonRepo);
		taskRepo = module.get(TaskRepo);
		userRepo = module.get(UserRepo);
		boardRepo = module.get(BoardRepo);
		mapper = module.get(RoomBoardDTOMapper);
	});

	describe('getBoard', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const board = boardFactory.buildWithId();
			const room = courseFactory.buildWithId({ students: [user], primaryBoard: board });
			const tasks = taskFactory.buildList(3, { course: room });
			const lessons = lessonFactory.buildList(3, { course: room });
			const dto = {
				roomId: room.id,
				displayColor: room.color,
				title: room.name,
				elements: [],
			};
			board.syncLessonsFromList(lessons);
			board.syncTasksFromList(tasks);
			const userSpy = jest.spyOn(userRepo, 'findById').mockImplementation(() => Promise.resolve(user));
			const roomSpy = jest.spyOn(courseRepo, 'findOne').mockImplementation(() => Promise.resolve(room));
			const boardSpy = jest.spyOn(room, 'getBoard').mockImplementation(() => Promise.resolve(board));
			const tasksSpy = jest.spyOn(taskRepo, 'findBySingleParent').mockImplementation(() => Promise.resolve([tasks, 3]));
			const lessonsSpy = jest
				.spyOn(lessonRepo, 'findAllByCourseIds')
				.mockImplementation(() => Promise.resolve([lessons, 3]));
			const syncLessonsSpy = jest.spyOn(board, 'syncLessonsFromList');
			const syncTasksSpy = jest.spyOn(board, 'syncTasksFromList');
			const mapperSpy = jest.spyOn(mapper, 'mapDTO').mockImplementation(() => dto);
			const persistSpy = jest.spyOn(boardRepo, 'save').mockImplementation(() => Promise.resolve());

			return {
				user,
				board,
				room,
				tasks,
				lessons,
				dto,
				userSpy,
				roomSpy,
				boardSpy,
				tasksSpy,
				lessonsSpy,
				syncLessonsSpy,
				syncTasksSpy,
				mapperSpy,
				persistSpy,
			};
		};

		it('should fetch correct user', async () => {
			const { room, user, userSpy } = setup();
			await uc.getBoard(room.id, user.id);
			expect(userSpy).toBeCalledWith(user.id, true);
		});

		it('should fetch correct room filtered by user', async () => {
			const { room, user, roomSpy } = setup();
			await uc.getBoard(room.id, user.id);
			expect(roomSpy).toHaveBeenCalledWith(room.id, user.id);
		});

		it('should fetch all lessons of room', async () => {
			const { room, user, lessonsSpy } = setup();
			await uc.getBoard(room.id, user.id);
			expect(lessonsSpy).toHaveBeenCalledWith([room.id]);
		});

		it('should fetch all tasks of room', async () => {
			const { room, user, tasksSpy } = setup();
			await uc.getBoard(room.id, user.id);
			expect(tasksSpy).toHaveBeenCalledWith(user.id, room.id);
		});

		it('should access primary board of room', async () => {
			const { room, user, boardSpy } = setup();
			await uc.getBoard(room.id, user.id);
			expect(boardSpy).toHaveBeenCalled();
		});

		it('should sync boards lessons with fetched lessons', async () => {
			const { room, user, lessons, syncLessonsSpy } = setup();
			await uc.getBoard(room.id, user.id);
			expect(syncLessonsSpy).toHaveBeenCalledWith(lessons);
		});

		it('should sync boards tasks with fetched tasks', async () => {
			const { room, user, tasks, syncTasksSpy } = setup();
			await uc.getBoard(room.id, user.id);
			expect(syncTasksSpy).toHaveBeenCalledWith(tasks);
		});

		it('should persist board', async () => {
			const { room, user, persistSpy, board } = setup();
			await uc.getBoard(room.id, user.id);
			expect(persistSpy).toHaveBeenCalledWith(board);
		});

		it('should call to construct result dto from room, board, and user', async () => {
			const { room, user, board, mapperSpy } = setup();
			await uc.getBoard(room.id, user.id);
			expect(mapperSpy).toHaveBeenCalledWith({ room, user, board });
		});

		it('should return result dto', async () => {
			const { room, user, dto } = setup();
			const result = await uc.getBoard(room.id, user.id);
			expect(result).toEqual(dto);
		});
	});
});
