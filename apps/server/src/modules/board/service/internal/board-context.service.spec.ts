import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { CourseService } from '@modules/course';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { GroupTypes } from '@modules/group';
import { groupFactory } from '@modules/group/testing';
import { roleFactory } from '@modules/role/testing';
import { RoomMembershipService } from '@modules/room-membership';
import { roomMembershipFactory } from '@modules/room-membership/testing';
import { roomFactory } from '@modules/room/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { BoardExternalReferenceType, BoardRoles, UserWithBoardRoles } from '../../domain';
import { columnBoardFactory, columnFactory } from '../../testing';
import { BoardContextService } from './board-context.service';

describe(BoardContextService.name, () => {
	let module: TestingModule;
	let service: BoardContextService;
	let courseService: DeepMocked<CourseService>;
	let roomMembershipService: DeepMocked<RoomMembershipService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardContextService,
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

		service = module.get(BoardContextService);
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

	describe('getUsersWithBoardRoles', () => {
		describe('when node has no context', () => {
			const setup = () => {
				const column = columnFactory.build({});

				return { column };
			};

			it('should return empty array', async () => {
				const { column } = setup();

				const result = await service.getUsersWithBoardRoles(column);

				expect(result).toHaveLength(0);
			});
		});

		describe('when node has wrong context type', () => {
			const setup = () => {
				const columnBoard = columnBoardFactory.build({
					context: { id: new ObjectId().toHexString(), type: 'foo' as BoardExternalReferenceType },
				});

				return { columnBoard };
			};

			it('should throw an error', async () => {
				const { columnBoard } = setup();

				await expect(service.getUsersWithBoardRoles(columnBoard)).rejects.toThrowError();
			});
		});

		describe('when node has a user context', () => {
			const setup = () => {
				const columnBoard = columnBoardFactory.build({
					context: { id: new ObjectId().toHexString(), type: BoardExternalReferenceType.User },
				});

				return { columnBoard };
			};

			it('should return user id + editor role', async () => {
				const { columnBoard } = setup();

				const result = await service.getUsersWithBoardRoles(columnBoard);
				const expected: UserWithBoardRoles[] = [
					{
						userId: columnBoard.context.id,
						roles: [BoardRoles.EDITOR],
					},
				];

				expect(result).toEqual(expected);
			});
		});

		describe('when node has a course context', () => {
			describe('when teachers are associated with the course', () => {
				const setup = () => {
					const teacher = userFactory.build();
					const course = courseEntityFactory.buildWithId({ teachers: [teacher] });
					const columnBoard = columnBoardFactory.build({
						context: { id: course.id, type: BoardExternalReferenceType.Course },
					});
					courseService.findById.mockResolvedValue(course);

					return { columnBoard, teacher };
				};

				it('should return their information + editor role', async () => {
					const { columnBoard, teacher } = setup();

					const result = await service.getUsersWithBoardRoles(columnBoard);
					const expected: UserWithBoardRoles[] = [
						{
							userId: teacher.id,
							firstName: teacher.firstName,
							lastName: teacher.lastName,
							roles: [BoardRoles.EDITOR],
						},
					];

					expect(result).toEqual(expected);
				});
			});

			describe('when substitution teachers are associated with the course', () => {
				const setup = () => {
					const substitutionTeacher = userFactory.build();
					const course = courseEntityFactory.buildWithId({ substitutionTeachers: [substitutionTeacher] });
					const columnBoard = columnBoardFactory.build({
						context: { id: course.id, type: BoardExternalReferenceType.Course },
					});
					courseService.findById.mockResolvedValue(course);

					return { columnBoard, substitutionTeacher };
				};

				it('should return their information + editor role', async () => {
					const { columnBoard, substitutionTeacher } = setup();

					const result = await service.getUsersWithBoardRoles(columnBoard);
					const expected: UserWithBoardRoles[] = [
						{
							userId: substitutionTeacher.id,
							firstName: substitutionTeacher.firstName,
							lastName: substitutionTeacher.lastName,
							roles: [BoardRoles.EDITOR],
						},
					];

					expect(result).toEqual(expected);
				});
			});

			describe('when students are associated with the course', () => {
				const setup = () => {
					const student = userFactory.build();
					const course = courseEntityFactory.buildWithId({ students: [student] });
					const columnBoard = columnBoardFactory.build({
						context: { id: course.id, type: BoardExternalReferenceType.Course },
					});
					courseService.findById.mockResolvedValue(course);

					return { columnBoard, student };
				};

				it('should return their information + reader role', async () => {
					const { columnBoard, student } = setup();

					const result = await service.getUsersWithBoardRoles(columnBoard);
					const expected: UserWithBoardRoles[] = [
						{
							userId: student.id,
							firstName: student.firstName,
							lastName: student.lastName,
							roles: [BoardRoles.READER],
						},
					];

					expect(result).toEqual(expected);
				});
			});

			describe('when evaluating the course context', () => {
				const setup = () => {
					const course = courseEntityFactory.buildWithId();
					const columnBoard = columnBoardFactory.build({
						context: { id: course.id, type: BoardExternalReferenceType.Course },
					});
					courseService.findById.mockResolvedValue(course);

					return { columnBoard };
				};

				it('should call the course repo', async () => {
					const { columnBoard } = setup();

					await service.getUsersWithBoardRoles(columnBoard);

					expect(courseService.findById).toHaveBeenCalledWith(columnBoard.context.id);
				});
			});
		});

		describe('when node has a room context', () => {
			describe('when user with editor role is associated with the room', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
					const { roomEditorRole } = RoomRolesTestFactory.createRoomRoles();
					const group = groupFactory.build({
						type: GroupTypes.ROOM,
						users: [{ userId: user.id, roleId: roomEditorRole.id }],
					});
					const room = roomFactory.build();
					roomMembershipFactory.build({ roomId: room.id, userGroupId: group.id });
					const columnBoard = columnBoardFactory.build({
						context: { id: room.id, type: BoardExternalReferenceType.Room },
					});

					return { columnBoard, role: roomEditorRole, user };
				};

				it('should return their information + editor role', async () => {
					const { columnBoard, role, user } = setup();

					roomMembershipService.getRoomMembershipAuthorizable.mockResolvedValue({
						id: 'foo',
						roomId: columnBoard.context.id,
						members: [{ userId: user.id, roles: [role] }],
						schoolId: user.school.id,
					});

					const result = await service.getUsersWithBoardRoles(columnBoard);
					const expected: UserWithBoardRoles[] = [
						{
							userId: user.id,
							roles: [BoardRoles.EDITOR],
						},
					];

					expect(result).toEqual(expected);
				});
			});

			describe('when user with view role is associated with the room', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
					const { roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
					const group = groupFactory.build({
						type: GroupTypes.ROOM,
						users: [{ userId: user.id, roleId: roomViewerRole.id }],
					});
					const room = roomFactory.build();
					roomMembershipFactory.build({ roomId: room.id, userGroupId: group.id });
					const columnBoard = columnBoardFactory.build({
						context: { id: room.id, type: BoardExternalReferenceType.Room },
					});

					return { columnBoard, role: roomViewerRole, user };
				};

				it('should return their information + reader role', async () => {
					const { columnBoard, role, user } = setup();

					roomMembershipService.getRoomMembershipAuthorizable.mockResolvedValue({
						id: 'foo',
						roomId: columnBoard.context.id,
						members: [{ userId: user.id, roles: [role] }],
						schoolId: user.school.id,
					});

					const result = await service.getUsersWithBoardRoles(columnBoard);
					const expected: UserWithBoardRoles[] = [
						{
							userId: user.id,
							roles: [BoardRoles.READER],
						},
					];

					expect(result).toEqual(expected);
				});
			});

			describe('when user with not-matching role is associated with the room', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
					const role = roleFactory.build();
					const group = groupFactory.build({ type: GroupTypes.ROOM, users: [{ userId: user.id, roleId: role.id }] });
					const room = roomFactory.build();
					roomMembershipFactory.build({ roomId: room.id, userGroupId: group.id });
					const columnBoard = columnBoardFactory.build({
						context: { id: room.id, type: BoardExternalReferenceType.Room },
					});

					return { columnBoard, role, user };
				};

				it('should return their information + no role', async () => {
					const { columnBoard, role, user } = setup();

					roomMembershipService.getRoomMembershipAuthorizable.mockResolvedValue({
						id: 'foo',
						roomId: columnBoard.context.id,
						members: [{ userId: user.id, roles: [role] }],
						schoolId: user.school.id,
					});

					const result = await service.getUsersWithBoardRoles(columnBoard);
					const expected: UserWithBoardRoles[] = [
						{
							userId: user.id,
							roles: [],
						},
					];

					expect(result).toEqual(expected);
				});
			});
		});
	});
});
