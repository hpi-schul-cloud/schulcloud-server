import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CourseService } from '@modules/course';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { LessonEntity } from '@modules/lesson/repository';
import { lessonFactory } from '@modules/lesson/testing';
import { UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Material, Submission, Task } from '@shared/domain/entity';
import { TaskRepo } from '@shared/repo/task';
import { setupEntities } from '@testing/database';
import { taskFactory } from '@testing/factory/task.factory';
import { LegacyBoard, LegacyBoardElement, LegacyBoardRepo } from '../repo';
import { CourseRoomsService } from '../service/course-rooms.service';
import { boardFactory } from '../testing';
import { RoomBoardDTO } from '../types';
import { CourseRoomsAuthorisationService } from './course-rooms.authorisation.service';
import { CourseRoomsUc } from './course-rooms.uc';
import { RoomBoardDTOFactory } from './room-board-dto.factory';

describe('rooms usecase', () => {
	let uc: CourseRoomsUc;
	let courseService: DeepMocked<CourseService>;
	let taskRepo: DeepMocked<TaskRepo>;
	let userService: DeepMocked<UserService>;
	let legacyBoardRepo: DeepMocked<LegacyBoardRepo>;
	let factory: DeepMocked<RoomBoardDTOFactory>;
	let authorisation: DeepMocked<CourseRoomsAuthorisationService>;
	let roomsService: DeepMocked<CourseRoomsService>;
	let module: TestingModule;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [],
			providers: [
				CourseRoomsUc,
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
				{
					provide: TaskRepo,
					useValue: createMock<TaskRepo>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
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
					provide: CourseRoomsAuthorisationService,
					useValue: createMock<CourseRoomsAuthorisationService>(),
				},
				{
					provide: CourseRoomsService,
					useValue: createMock<CourseRoomsService>(),
				},
			],
		}).compile();

		uc = module.get(CourseRoomsUc);
		courseService = module.get(CourseService);
		taskRepo = module.get(TaskRepo);
		userService = module.get(UserService);
		legacyBoardRepo = module.get(LegacyBoardRepo);
		factory = module.get(RoomBoardDTOFactory);
		authorisation = module.get(CourseRoomsAuthorisationService);
		roomsService = module.get(CourseRoomsService);

		await setupEntities([
			User,
			CourseEntity,
			CourseGroupEntity,
			Task,
			Submission,
			LessonEntity,
			Material,
			LegacyBoard,
			LegacyBoardElement,
		]);
	});

	describe('getBoard', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const room = courseEntityFactory.buildWithId({ students: [user] });
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

			const userSpy = userService.getUserEntityWithRoles.mockResolvedValue(user);
			const roomSpy = courseService.findOneForUser.mockResolvedValue(room);
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
			expect(userSpy).toBeCalledWith(user.id);
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
			const room = courseEntityFactory.buildWithId({ students: [user] });
			const hiddenTask = taskFactory.draft().buildWithId({ course: room });
			const visibleTask = taskFactory.buildWithId({ course: room });
			const board = boardFactory.buildWithId({ course: room });
			board.syncBoardElementReferences([hiddenTask, visibleTask]);
			const userSpy = userService.getUserEntityWithRoles.mockResolvedValue(user);
			const roomSpy = courseService.findOneForUser.mockResolvedValue(room);
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
			const room = courseEntityFactory.buildWithId({ teachers: [user] });
			const tasks = [taskFactory.buildWithId(), taskFactory.buildWithId(), taskFactory.buildWithId()];
			const board = boardFactory.buildWithId({ course: room });
			board.syncBoardElementReferences(tasks);
			const reorderSpy = jest.spyOn(board, 'reorderElements');
			const userSpy = userService.getUserEntityWithRoles.mockResolvedValue(user);
			const roomSpy = courseService.findOneForUser.mockResolvedValue(room);
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
