import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, lessonFactory, taskFactory, userFactory, boardFactory, setupEntities } from '@shared/testing';
import { Course, EntityId, User, Board } from '@shared/domain';
import { CourseRepo, LessonRepo, TaskRepo, UserRepo, BoardRepo } from '@shared/repo';
import { MikroORM } from '@mikro-orm/core';
import { RoomBoardDTO } from '../types';
import { RoomsUc } from './rooms.uc';
import { RoomBoardDTOFactory } from './room-board-dto.factory';
import { RoomsAuthorisationService } from './rooms.authorisation.service';

describe('rooms usecase', () => {
	let uc: RoomsUc;
	let courseRepo: CourseRepo;
	let lessonRepo: LessonRepo;
	let taskRepo: TaskRepo;
	let userRepo: UserRepo;
	let boardRepo: BoardRepo;
	let orm: MikroORM;
	let factory: RoomBoardDTOFactory;
	let authorisation: RoomsAuthorisationService;

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
						findByCourseId(courseId: EntityId): Promise<Board> {
							throw new Error('Please write a mock for BoardRepo.findByCourseId');
						},
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						save(board: Board): Promise<void> {
							throw new Error('Please write a mock for BoardRepo.save');
						},
					},
				},
				{
					provide: RoomBoardDTOFactory,
					useValue: {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						createDTO({ room, board, user }: { room: Course; board: Board; user: User }): RoomBoardDTO {
							throw new Error('Please write a mock for RoomBoardDTOMapper.mapDTO');
						},
					},
				},
				{
					provide: RoomsAuthorisationService,
					useValue: {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						hasCourseWritePermission(user: User, course: Course): boolean {
							throw new Error('Please write a mock for RoomsAuthorisationService.hasCourseWritePermission');
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
		factory = module.get(RoomBoardDTOFactory);
		authorisation = module.get(RoomsAuthorisationService);
	});

	describe('getBoard', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const room = courseFactory.buildWithId({ students: [user] });
			const tasks = taskFactory.buildList(3, { course: room });
			const lessons = lessonFactory.buildList(3, { course: room });
			const board = boardFactory.buildWithId({ course: room });
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
			const boardSpy = jest.spyOn(boardRepo, 'findByCourseId').mockImplementation(() => Promise.resolve(board));
			const tasksSpy = jest.spyOn(taskRepo, 'findBySingleParent').mockImplementation(() => Promise.resolve([tasks, 3]));
			const lessonsSpy = jest
				.spyOn(lessonRepo, 'findAllByCourseIds')
				.mockImplementation(() => Promise.resolve([lessons, 3]));
			const syncLessonsSpy = jest.spyOn(board, 'syncLessonsFromList');
			const syncTasksSpy = jest.spyOn(board, 'syncTasksFromList');
			const mapperSpy = jest.spyOn(factory, 'createDTO').mockImplementation(() => dto);
			const saveSpy = jest.spyOn(boardRepo, 'save').mockImplementation(() => Promise.resolve());

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
				saveSpy,
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
			const { room, user, saveSpy, board } = setup();
			await uc.getBoard(room.id, user.id);
			expect(saveSpy).toHaveBeenCalledWith(board);
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

	describe('updateVisibilityOfBoardElement', () => {
		const setup = (shouldAuthorize: boolean) => {
			const user = userFactory.buildWithId();
			const room = courseFactory.buildWithId({ students: [user] });
			const hiddenTask = taskFactory.draft().buildWithId({ course: room });
			const visibleTask = taskFactory.buildWithId({ course: room });
			const board = boardFactory.buildWithId({ course: room });
			board.syncTasksFromList([hiddenTask, visibleTask]);
			const userSpy = jest.spyOn(userRepo, 'findById').mockImplementation(() => Promise.resolve(user));
			const roomSpy = jest.spyOn(courseRepo, 'findOne').mockImplementation(() => Promise.resolve(room));
			const boardSpy = jest.spyOn(boardRepo, 'findByCourseId').mockImplementation(() => Promise.resolve(board));
			const authorisationSpy = jest
				.spyOn(authorisation, 'hasCourseWritePermission')
				.mockImplementation(() => shouldAuthorize);
			const saveSpy = jest.spyOn(boardRepo, 'save').mockImplementation(() => Promise.resolve());
			return { user, room, hiddenTask, visibleTask, board, userSpy, roomSpy, boardSpy, authorisationSpy, saveSpy };
		};

		describe('when user does not have write permission on course', () => {
			it('should throw forbidden', async () => {
				const { user, room, hiddenTask } = setup(false);
				const call = () => uc.updateVisibilityOfBoardElement(room.id, hiddenTask.id, user.id, true);
				await expect(call).rejects.toThrow(ForbiddenException);
			});
		});

		describe('when visibility is true', () => {
			it('should publish element', async () => {
				const { user, room, hiddenTask } = setup(true);
				await uc.updateVisibilityOfBoardElement(room.id, hiddenTask.id, user.id, true);
				expect(hiddenTask.isDraft()).toEqual(false);
			});
		});

		describe('when visibility is false', () => {
			it('should unpublish element', async () => {
				const { user, room, visibleTask } = setup(true);
				await uc.updateVisibilityOfBoardElement(room.id, visibleTask.id, user.id, false);
				expect(visibleTask.isDraft()).toEqual(true);
			});
		});

		it('should fetch user', async () => {
			const { user, room, hiddenTask, userSpy } = setup(true);
			await uc.updateVisibilityOfBoardElement(room.id, hiddenTask.id, user.id, true);
			expect(userSpy).toHaveBeenCalledWith(user.id);
		});

		it('should fetch course with userid', async () => {
			const { user, room, hiddenTask, roomSpy } = setup(true);
			await uc.updateVisibilityOfBoardElement(room.id, hiddenTask.id, user.id, true);
			expect(roomSpy).toHaveBeenCalledWith(room.id, user.id);
		});

		it('should fetch course with userid', async () => {
			const { user, room, hiddenTask, roomSpy } = setup(true);
			await uc.updateVisibilityOfBoardElement(room.id, hiddenTask.id, user.id, true);
			expect(roomSpy).toHaveBeenCalledWith(room.id, user.id);
		});

		it('should persist board after changes', async () => {
			const { user, room, hiddenTask, board, saveSpy } = setup(true);
			await uc.updateVisibilityOfBoardElement(room.id, hiddenTask.id, user.id, true);
			expect(saveSpy).toHaveBeenCalledWith(board);
		});
	});

	describe('reorderBoardElements', () => {
		const setup = (shouldAuthorize: boolean) => {
			const user = userFactory.buildWithId();
			const room = courseFactory.buildWithId({ teachers: [user] });
			const tasks = [taskFactory.buildWithId(), taskFactory.buildWithId(), taskFactory.buildWithId()];
			const board = boardFactory.buildWithId({ course: room });
			board.syncTasksFromList(tasks);
			const reorderSpy = jest.spyOn(board, 'reorderElements');
			const userSpy = jest.spyOn(userRepo, 'findById').mockImplementation(() => Promise.resolve(user));
			const roomSpy = jest.spyOn(courseRepo, 'findOne').mockImplementation(() => Promise.resolve(room));
			const boardSpy = jest.spyOn(boardRepo, 'findByCourseId').mockImplementation(() => Promise.resolve(board));
			const authorisationSpy = jest
				.spyOn(authorisation, 'hasCourseWritePermission')
				.mockImplementation(() => shouldAuthorize);
			const saveSpy = jest.spyOn(boardRepo, 'save').mockImplementation(() => Promise.resolve());
			return { user, room, tasks, board, reorderSpy, userSpy, roomSpy, boardSpy, authorisationSpy, saveSpy };
		};

		it('should fetch the user', async () => {
			const { user, room, tasks, userSpy } = setup(true);

			await uc.reorderBoardElements(
				room.id,
				user.id,
				tasks.map((task) => task.id)
			);
			expect(userSpy).toHaveBeenCalledWith(user.id);
		});

		it('should fetch the room', async () => {
			const { user, room, tasks, roomSpy } = setup(true);

			await uc.reorderBoardElements(
				room.id,
				user.id,
				tasks.map((task) => task.id)
			);
			expect(roomSpy).toHaveBeenCalledWith(room.id, user.id);
		});

		it('should fetch the board', async () => {
			const { user, room, tasks, boardSpy } = setup(true);

			await uc.reorderBoardElements(
				room.id,
				user.id,
				tasks.map((task) => task.id)
			);
			expect(boardSpy).toHaveBeenCalledWith(room.id);
		});

		it('should reorder the board based on the passed list', async () => {
			const { user, room, tasks, reorderSpy } = setup(true);

			await uc.reorderBoardElements(
				room.id,
				user.id,
				tasks.map((task) => task.id)
			);
			expect(reorderSpy).toHaveBeenCalledWith(tasks.map((task) => task.id));
		});

		it('should persist', async () => {
			const { user, room, tasks, saveSpy, board } = setup(true);

			await uc.reorderBoardElements(
				room.id,
				user.id,
				tasks.map((task) => task.id)
			);
			expect(saveSpy).toHaveBeenCalledWith(board);
		});

		it('should have called authorisation service', async () => {
			const { user, room, tasks, authorisationSpy } = setup(true);

			await uc.reorderBoardElements(
				room.id,
				user.id,
				tasks.map((task) => task.id)
			);
			expect(authorisationSpy).toHaveBeenCalledWith(user, room);
		});

		it('should throw when user is not authorized', async () => {
			const { user, room, tasks } = setup(false);

			const call = () =>
				uc.reorderBoardElements(
					room.id,
					user.id,
					tasks.map((task) => task.id)
				);
			await expect(call).rejects.toThrow(ForbiddenException);
		});
	});
});
