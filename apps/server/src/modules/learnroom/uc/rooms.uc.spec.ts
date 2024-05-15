import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CourseRepo, LegacyBoardRepo, TaskRepo, UserRepo } from '@shared/repo';
import { boardFactory, courseFactory, lessonFactory, setupEntities, taskFactory, userFactory } from '@shared/testing';
import { RoomsService } from '../service/rooms.service';
import { RoomBoardDTO } from '../types';
import { RoomBoardDTOFactory } from './room-board-dto.factory';
import { RoomsAuthorisationService } from './rooms.authorisation.service';
import { RoomsUc } from './rooms.uc';

describe('rooms usecase', () => {
	let uc: RoomsUc;
	let courseRepo: DeepMocked<CourseRepo>;
	let taskRepo: DeepMocked<TaskRepo>;
	let userRepo: DeepMocked<UserRepo>;
	let legacyBoardRepo: DeepMocked<LegacyBoardRepo>;
	let factory: DeepMocked<RoomBoardDTOFactory>;
	let authorisation: DeepMocked<RoomsAuthorisationService>;
	let roomsService: DeepMocked<RoomsService>;
	let module: TestingModule;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [],
			providers: [
				RoomsUc,
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
				{
					provide: TaskRepo,
					useValue: createMock<TaskRepo>(),
				},
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: LegacyBoardRepo,
					useValue: createMock<LegacyBoardRepo>(),
				},
				{
					provide: RoomBoardDTOFactory,
					useValue: createMock<RoomBoardDTOFactory>(),
				},
				{
					provide: RoomsAuthorisationService,
					useValue: createMock<RoomsAuthorisationService>(),
				},
				{
					provide: RoomsService,
					useValue: createMock<RoomsService>(),
				},
			],
		}).compile();

		uc = module.get(RoomsUc);
		courseRepo = module.get(CourseRepo);
		taskRepo = module.get(TaskRepo);
		userRepo = module.get(UserRepo);
		legacyBoardRepo = module.get(LegacyBoardRepo);
		factory = module.get(RoomBoardDTOFactory);
		authorisation = module.get(RoomsAuthorisationService);
		roomsService = module.get(RoomsService);
		await setupEntities();
	});

	describe('getBoard', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const room = courseFactory.buildWithId({ students: [user] });
			const tasks = taskFactory.buildList(3, { course: room });
			const lessons = lessonFactory.buildList(3, { course: room });
			const board = boardFactory.buildWithId({ course: room });
			const roomBoardDTO: RoomBoardDTO = {
				roomId: room.id,
				displayColor: room.color,
				title: room.name,
				elements: [],
				isArchived: room.isFinished(),
				isSynchronized: !!room.syncedWithGroup,
			};

			board.syncBoardElementReferences([...lessons, ...tasks]);

			const userSpy = userRepo.findById.mockResolvedValue(user);
			const roomSpy = courseRepo.findOne.mockResolvedValue(room);
			const boardSpy = legacyBoardRepo.findByCourseId.mockResolvedValue(board);
			const tasksSpy = taskRepo.findBySingleParent.mockResolvedValue([tasks, 3]);
			const syncBoardElementReferencesSpy = jest.spyOn(board, 'syncBoardElementReferences');
			const mapperSpy = factory.createDTO.mockReturnValue(roomBoardDTO);
			const saveSpy = legacyBoardRepo.save.mockResolvedValue();
			roomsService.updateLegacyBoard.mockResolvedValue(board);

			return {
				user,
				board,
				room,
				tasks,
				lessons,
				roomBoardDTO,
				userSpy,
				roomSpy,
				boardSpy,
				tasksSpy,
				syncBoardElementReferencesSpy,
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

		it('should access primary board of room', async () => {
			const { room, user, boardSpy } = setup();
			await uc.getBoard(room.id, user.id);
			expect(boardSpy).toHaveBeenCalled();
		});

		it('should call to construct result dto from room, board, and user', async () => {
			const { room, user, board, mapperSpy } = setup();
			await uc.getBoard(room.id, user.id);
			expect(mapperSpy).toHaveBeenCalledWith({ room, user, board });
		});

		it('should return result dto', async () => {
			const { room, user, roomBoardDTO } = setup();
			const result = await uc.getBoard(room.id, user.id);
			expect(result).toEqual(roomBoardDTO);
		});

		it('should ensure course has uptodate board', async () => {
			const { board, room, user } = setup();
			await uc.getBoard(room.id, user.id);
			expect(roomsService.updateLegacyBoard).toHaveBeenCalledWith(board, room.id, user.id);
		});
	});

	describe('updateVisibilityOfBoardElement', () => {
		const setup = (shouldAuthorize: boolean) => {
			const user = userFactory.buildWithId();
			const room = courseFactory.buildWithId({ students: [user] });
			const hiddenTask = taskFactory.draft().buildWithId({ course: room });
			const visibleTask = taskFactory.buildWithId({ course: room });
			const board = boardFactory.buildWithId({ course: room });
			board.syncBoardElementReferences([hiddenTask, visibleTask]);
			const userSpy = userRepo.findById.mockResolvedValue(user);
			const roomSpy = courseRepo.findOne.mockResolvedValue(room);
			const boardSpy = legacyBoardRepo.findByCourseId.mockResolvedValue(board);
			const authorisationSpy = authorisation.hasCourseWritePermission.mockReturnValue(shouldAuthorize);
			const saveSpy = legacyBoardRepo.save.mockResolvedValue();
			return { user, room, hiddenTask, visibleTask, board, userSpy, roomSpy, boardSpy, authorisationSpy, saveSpy };
		};

		describe('when user does not have write permission on course', () => {
			it('should throw forbidden', async () => {
				const { user, room, hiddenTask } = setup(false);
				const call = () => uc.updateVisibilityOfLegacyBoardElement(room.id, hiddenTask.id, user.id, true);
				await expect(call).rejects.toThrow(ForbiddenException);
			});
		});

		describe('when visibility is true', () => {
			it('should publish element', async () => {
				const { user, room, hiddenTask } = setup(true);
				await uc.updateVisibilityOfLegacyBoardElement(room.id, hiddenTask.id, user.id, true);
				expect(hiddenTask.isDraft()).toEqual(false);
			});
		});

		describe('when visibility is false', () => {
			it('should unpublish element', async () => {
				const { user, room, visibleTask } = setup(true);
				await uc.updateVisibilityOfLegacyBoardElement(room.id, visibleTask.id, user.id, false);
				expect(visibleTask.isDraft()).toEqual(true);
			});
		});

		it('should fetch user', async () => {
			const { user, room, hiddenTask, userSpy } = setup(true);
			await uc.updateVisibilityOfLegacyBoardElement(room.id, hiddenTask.id, user.id, true);
			expect(userSpy).toHaveBeenCalledWith(user.id);
		});

		it('should fetch course with userid', async () => {
			const { user, room, hiddenTask, roomSpy } = setup(true);
			await uc.updateVisibilityOfLegacyBoardElement(room.id, hiddenTask.id, user.id, true);
			expect(roomSpy).toHaveBeenCalledWith(room.id, user.id);
		});

		it('should fetch course with userid', async () => {
			const { user, room, hiddenTask, roomSpy } = setup(true);
			await uc.updateVisibilityOfLegacyBoardElement(room.id, hiddenTask.id, user.id, true);
			expect(roomSpy).toHaveBeenCalledWith(room.id, user.id);
		});

		it('should persist board after changes', async () => {
			const { user, room, hiddenTask, board, saveSpy } = setup(true);
			await uc.updateVisibilityOfLegacyBoardElement(room.id, hiddenTask.id, user.id, true);
			expect(saveSpy).toHaveBeenCalledWith(board);
		});
	});

	describe('reorderBoardElements', () => {
		const setup = (shouldAuthorize: boolean) => {
			const user = userFactory.buildWithId();
			const room = courseFactory.buildWithId({ teachers: [user] });
			const tasks = [taskFactory.buildWithId(), taskFactory.buildWithId(), taskFactory.buildWithId()];
			const board = boardFactory.buildWithId({ course: room });
			board.syncBoardElementReferences(tasks);
			const reorderSpy = jest.spyOn(board, 'reorderElements');
			const userSpy = userRepo.findById.mockResolvedValue(user);
			const roomSpy = courseRepo.findOne.mockResolvedValue(room);
			const boardSpy = legacyBoardRepo.findByCourseId.mockResolvedValue(board);
			const authorisationSpy = authorisation.hasCourseWritePermission.mockReturnValue(shouldAuthorize);
			const saveSpy = legacyBoardRepo.save.mockResolvedValue();
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
