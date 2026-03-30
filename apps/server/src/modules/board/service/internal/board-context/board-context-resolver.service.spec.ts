import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { CourseService } from '@modules/course';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { RoomService } from '@modules/room';
import { RoomAuthorizable, RoomMembershipService } from '@modules/room-membership';
import { roomFactory } from '@modules/room/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { BoardExternalReference, BoardExternalReferenceType } from '../../../domain';
import { BoardContextResolverService } from './board-context-resolver.service';
import { CourseBoardContext } from './course-board-context';
import { RoomBoardContext } from './room-board-context';
import { UserBoardContext } from './user-board-context';

describe(BoardContextResolverService.name, () => {
	let module: TestingModule;
	let service: BoardContextResolverService;
	let courseService: DeepMocked<CourseService>;
	let roomService: DeepMocked<RoomService>;
	let roomMembershipService: DeepMocked<RoomMembershipService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardContextResolverService,
				{
					provide: RoomService,
					useValue: createMock<RoomService>(),
				},
				{
					provide: RoomMembershipService,
					useValue: createMock<RoomMembershipService>(),
				},
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
			],
		}).compile();

		service = module.get(BoardContextResolverService);
		roomService = module.get(RoomService);
		roomMembershipService = module.get(RoomMembershipService);
		courseService = module.get(CourseService);

		await setupEntities([User, CourseEntity, CourseGroupEntity]);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('resolve', () => {
		describe('when context type is Room', () => {
			const setup = () => {
				const room = roomFactory.build();
				const roomAuthorizable = new RoomAuthorizable(room.id, [], room.schoolId);
				const contextRef: BoardExternalReference = {
					id: room.id,
					type: BoardExternalReferenceType.Room,
				};

				roomService.getSingleRoom.mockResolvedValue(room);
				roomMembershipService.getRoomAuthorizable.mockResolvedValue(roomAuthorizable);

				return { contextRef, room, roomAuthorizable };
			};

			it('should fetch Room and RoomAuthorizable in parallel', async () => {
				const { contextRef, room } = setup();

				await service.resolve(contextRef);

				expect(roomService.getSingleRoom).toHaveBeenCalledWith(room.id);
				expect(roomMembershipService.getRoomAuthorizable).toHaveBeenCalledWith(room.id);
			});

			it('should return a RoomBoardContext', async () => {
				const { contextRef } = setup();

				const result = await service.resolve(contextRef);

				expect(result).toBeInstanceOf(RoomBoardContext);
				expect(result.type).toBe(BoardExternalReferenceType.Room);
			});
		});

		describe('when context type is Course', () => {
			const setup = () => {
				const teacher = userFactory.build();
				const student = userFactory.build({ school: teacher.school });
				const course = courseEntityFactory.buildWithId({
					teachers: [teacher],
					students: [student],
					school: teacher.school,
				});
				const contextRef: BoardExternalReference = {
					id: course.id,
					type: BoardExternalReferenceType.Course,
				};

				courseService.findById.mockResolvedValue(course);

				return { contextRef, course, teacher, student };
			};

			it('should fetch the course', async () => {
				const { contextRef, course } = setup();

				await service.resolve(contextRef);

				expect(courseService.findById).toHaveBeenCalledWith(course.id);
			});

			it('should return a CourseBoardContext', async () => {
				const { contextRef } = setup();

				const result = await service.resolve(contextRef);

				expect(result).toBeInstanceOf(CourseBoardContext);
				expect(result.type).toBe(BoardExternalReferenceType.Course);
			});

			it('should include teachers, substitution teachers, and students', async () => {
				const { contextRef, teacher, student } = setup();

				const result = await service.resolve(contextRef);
				const users = result.getUsersWithBoardRoles();

				expect(users).toHaveLength(2);
				expect(users.find((u) => u.userId === teacher.id)).toBeDefined();
				expect(users.find((u) => u.userId === student.id)).toBeDefined();
			});

			it('should filter out users from different schools', async () => {
				const teacher = userFactory.build();
				const studentFromOtherSchool = userFactory.build(); // Different school
				const course = courseEntityFactory.buildWithId({
					teachers: [teacher],
					students: [studentFromOtherSchool],
					school: teacher.school,
				});
				const contextRef: BoardExternalReference = {
					id: course.id,
					type: BoardExternalReferenceType.Course,
				};

				courseService.findById.mockResolvedValue(course);

				const result = await service.resolve(contextRef);
				const users = result.getUsersWithBoardRoles();

				// Only teacher should be included (student is from different school)
				expect(users).toHaveLength(1);
				expect(users[0].userId).toBe(teacher.id);
			});
		});

		describe('when context type is User', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const contextRef: BoardExternalReference = {
					id: userId,
					type: BoardExternalReferenceType.User,
				};

				return { contextRef, userId };
			};

			it('should return a UserBoardContext', async () => {
				const { contextRef } = setup();

				const result = await service.resolve(contextRef);

				expect(result).toBeInstanceOf(UserBoardContext);
				expect(result.type).toBe(BoardExternalReferenceType.User);
			});

			it('should not make any service calls', async () => {
				const { contextRef } = setup();

				await service.resolve(contextRef);

				expect(courseService.findById).not.toHaveBeenCalled();
				expect(roomService.getSingleRoom).not.toHaveBeenCalled();
				expect(roomMembershipService.getRoomAuthorizable).not.toHaveBeenCalled();
			});

			it('should return the user with correct roles', async () => {
				const { contextRef, userId } = setup();

				const result = await service.resolve(contextRef);
				const users = result.getUsersWithBoardRoles();

				expect(users).toHaveLength(1);
				expect(users[0].userId).toBe(userId);
			});
		});

		describe('when context type is unknown', () => {
			it('should throw an error', async () => {
				const contextRef: BoardExternalReference = {
					id: new ObjectId().toHexString(),
					type: 'unknown' as BoardExternalReferenceType,
				};

				await expect(service.resolve(contextRef)).rejects.toThrow("Unknown context type: 'unknown'");
			});
		});
	});
});
