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
import { BoardExternalReferenceType, BoardRoles } from '../../domain';
import { columnBoardFactory, columnFactory } from '../../testing';
import { BoardAuthContext, BoardContextService } from './board-context.service';
import { RoomService } from '@modules/room';

describe(BoardContextService.name, () => {
	let module: TestingModule;
	let service: BoardContextService;
	let courseService: DeepMocked<CourseService>;
	let roomService: DeepMocked<RoomService>;
	let roomMembershipService: DeepMocked<RoomMembershipService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardContextService,
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

		service = module.get(BoardContextService);
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

	describe('getUsersWithBoardRoles', () => {
		describe('when node has no context', () => {
			const setup = () => {
				const column = columnFactory.build({});

				return { column };
			};

			it('should return empty empty auth context', async () => {
				const { column } = setup();

				const result = await service.getBoardAuthContext(column);

				expect(result).toStrictEqual({ users: [], schoolId: undefined });
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

				await expect(service.getBoardAuthContext(columnBoard)).rejects.toThrowError();
			});
		});

		describe('when node has a user context', () => {
			const setup = () => {
				const columnBoard = columnBoardFactory.build({
					context: { id: new ObjectId().toHexString(), type: BoardExternalReferenceType.User },
				});

				return { columnBoard };
			};

			it('should return user id + editor & admin role', async () => {
				const { columnBoard } = setup();

				const result = await service.getBoardAuthContext(columnBoard);
				const expected: BoardAuthContext = {
					users: [
						{
							userId: columnBoard.context.id,
							roles: [BoardRoles.EDITOR, BoardRoles.ADMIN],
						},
					],
					schoolId: undefined,
				};

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

					return { columnBoard, teacher, course };
				};

				it('should return their information + editor & admin role', async () => {
					const { columnBoard, teacher, course } = setup();

					const result = await service.getBoardAuthContext(columnBoard);
					const expected: BoardAuthContext = {
						users: [
							{
								userId: teacher.id,
								firstName: teacher.firstName,
								lastName: teacher.lastName,
								roles: [BoardRoles.EDITOR, BoardRoles.ADMIN],
							},
						],
						schoolId: course.school.id,
					};

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

					return { columnBoard, substitutionTeacher, course };
				};

				it('should return their information + editor & admin role', async () => {
					const { columnBoard, substitutionTeacher, course } = setup();

					const result = await service.getBoardAuthContext(columnBoard);
					const expected: BoardAuthContext = {
						users: [
							{
								userId: substitutionTeacher.id,
								firstName: substitutionTeacher.firstName,
								lastName: substitutionTeacher.lastName,
								roles: [BoardRoles.EDITOR, BoardRoles.ADMIN],
							},
						],
						schoolId: course.school.id,
					};

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

					return { columnBoard, student, course };
				};

				it('should return their information + reader role', async () => {
					const { columnBoard, student, course } = setup();

					const result = await service.getBoardAuthContext(columnBoard);
					const expected: BoardAuthContext = {
						users: [
							{
								userId: student.id,
								firstName: student.firstName,
								lastName: student.lastName,
								roles: [BoardRoles.READER],
							},
						],
						schoolId: course.school.id,
					};

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

					await service.getBoardAuthContext(columnBoard);

					expect(courseService.findById).toHaveBeenCalledWith(columnBoard.context.id);
				});
			});
		});

		describe('when node has a room context', () => {
			describe('when user with owner role is associated with the room', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
					const { roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();
					const group = groupFactory.build({
						type: GroupTypes.ROOM,
						users: [{ userId: user.id, roleId: roomOwnerRole.id }],
					});
					const room = roomFactory.build();
					roomMembershipFactory.build({ roomId: room.id, userGroupId: group.id });
					const columnBoard = columnBoardFactory.build({
						context: { id: room.id, type: BoardExternalReferenceType.Room },
					});

					roomService.getSingleRoom.mockResolvedValueOnce(room);

					return { columnBoard, role: roomOwnerRole, user, room };
				};

				it('should return their information + admin & editor role', async () => {
					const { columnBoard, role, user, room } = setup();

					roomMembershipService.getRoomMembershipAuthorizable.mockResolvedValue({
						id: 'foo',
						roomId: columnBoard.context.id,
						members: [{ userId: user.id, roles: [role] }],
						schoolId: user.school.id,
					});

					const result = await service.getBoardAuthContext(columnBoard);
					const expected: BoardAuthContext = {
						users: [
							{
								userId: user.id,
								roles: [BoardRoles.EDITOR, BoardRoles.ADMIN],
							},
						],
						schoolId: room.schoolId,
					};

					expect(result).toEqual(expected);
				});
			});

			describe('when user with room admin role is associated with the room', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
					const { roomAdminRole } = RoomRolesTestFactory.createRoomRoles();
					const group = groupFactory.build({
						type: GroupTypes.ROOM,
						users: [{ userId: user.id, roleId: roomAdminRole.id }],
					});
					const room = roomFactory.build();
					roomMembershipFactory.build({ roomId: room.id, userGroupId: group.id });
					const columnBoard = columnBoardFactory.build({
						context: { id: room.id, type: BoardExternalReferenceType.Room },
					});

					roomService.getSingleRoom.mockResolvedValueOnce(room);

					return { columnBoard, role: roomAdminRole, user, room };
				};

				it('should return their information + admin & editor role', async () => {
					const { columnBoard, role, user, room } = setup();

					roomMembershipService.getRoomMembershipAuthorizable.mockResolvedValue({
						id: 'foo',
						roomId: columnBoard.context.id,
						members: [{ userId: user.id, roles: [role] }],
						schoolId: user.school.id,
					});

					const result = await service.getBoardAuthContext(columnBoard);
					const expected: BoardAuthContext = {
						users: [
							{
								userId: user.id,
								roles: [BoardRoles.EDITOR, BoardRoles.ADMIN],
							},
						],
						schoolId: room.schoolId,
					};

					expect(result).toEqual(expected);
				});
			});

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

					roomService.getSingleRoom.mockResolvedValueOnce(room);

					return { columnBoard, role: roomEditorRole, user, room };
				};

				it('should return their information + editor role', async () => {
					const { columnBoard, role, user, room } = setup();

					roomMembershipService.getRoomMembershipAuthorizable.mockResolvedValue({
						id: 'foo',
						roomId: columnBoard.context.id,
						members: [{ userId: user.id, roles: [role] }],
						schoolId: user.school.id,
					});

					const result = await service.getBoardAuthContext(columnBoard);
					const expected: BoardAuthContext = {
						users: [
							{
								userId: user.id,
								roles: [BoardRoles.EDITOR],
							},
						],
						schoolId: room.schoolId,
					};

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

					roomService.getSingleRoom.mockResolvedValueOnce(room);

					return { columnBoard, role: roomViewerRole, user, room };
				};

				it('should return their information + reader role', async () => {
					const { columnBoard, role, user, room } = setup();

					roomMembershipService.getRoomMembershipAuthorizable.mockResolvedValue({
						id: 'foo',
						roomId: columnBoard.context.id,
						members: [{ userId: user.id, roles: [role] }],
						schoolId: user.school.id,
					});

					const result = await service.getBoardAuthContext(columnBoard);
					const expected: BoardAuthContext = {
						users: [
							{
								userId: user.id,
								roles: [BoardRoles.READER],
							},
						],
						schoolId: room.schoolId,
					};

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

					roomService.getSingleRoom.mockResolvedValueOnce(room);

					return { columnBoard, role, user, room };
				};

				it('should return their information + no role', async () => {
					const { columnBoard, role, user, room } = setup();

					roomMembershipService.getRoomMembershipAuthorizable.mockResolvedValue({
						id: 'foo',
						roomId: columnBoard.context.id,
						members: [{ userId: user.id, roles: [role] }],
						schoolId: user.school.id,
					});

					const result = await service.getBoardAuthContext(columnBoard);
					const expected: BoardAuthContext = {
						users: [
							{
								userId: user.id,
								roles: [],
							},
						],
						schoolId: room.schoolId,
					};

					expect(result).toEqual(expected);
				});
			});
		});
	});

	describe('getBoardSettings', () => {
		describe('when node has no context', () => {
			const setup = () => {
				const column = columnFactory.build({});

				return { column };
			};

			it('should return empty settings object', async () => {
				const { column } = setup();

				const result = await service.getBoardSettings(column);

				expect(result).toEqual({});
			});
		});

		describe('when node has wrong context type', () => {
			const setup = () => {
				const columnBoard = columnBoardFactory.build({
					context: { id: new ObjectId().toHexString(), type: 'invalid_type' as BoardExternalReferenceType },
				});

				return { columnBoard };
			};

			it('should throw an error', async () => {
				const { columnBoard } = setup();

				await expect(service.getBoardSettings(columnBoard)).rejects.toThrowError();
			});
		});

		describe('when node has user context', () => {
			const setup = () => {
				const columnBoard = columnBoardFactory.build({
					context: { id: new ObjectId().toHexString(), type: BoardExternalReferenceType.User },
				});

				return { columnBoard };
			};

			it('should return empty settings object', async () => {
				const { columnBoard } = setup();

				const result = await service.getBoardSettings(columnBoard);

				expect(result).toEqual({});
			});
		});

		describe('when node has course context', () => {
			const setup = () => {
				const columnBoard = columnBoardFactory.build({
					context: { id: new ObjectId().toHexString(), type: BoardExternalReferenceType.Course },
				});

				return { columnBoard };
			};

			it('should return empty settings object', async () => {
				const { columnBoard } = setup();

				const result = await service.getBoardSettings(columnBoard);

				expect(result).toEqual({});
			});
		});

		describe('when node has room context', () => {
			const setup = () => {
				const roomId = new ObjectId().toHexString();
				const room = roomFactory.build({ id: roomId });
				const columnBoard = columnBoardFactory.build({
					context: { id: room.id, type: BoardExternalReferenceType.Room },
				});
				roomService.getSingleRoom.mockResolvedValueOnce(room);

				return { columnBoard, room };
			};

			describe('when room editor can manage videoconference', () => {
				it('should return settings with canRoomEditorManageVideoconference true', async () => {
					const { columnBoard, room } = setup();

					roomService.canEditorManageVideoconferences.mockReturnValueOnce(true);

					const result = await service.getBoardSettings(columnBoard);

					expect(result).toEqual({ canRoomEditorManageVideoconference: true });
					expect(roomService.canEditorManageVideoconferences).toHaveBeenCalledWith(room);
				});
			});

			describe('when room editor can NOT manage videoconference', () => {
				it('should return settings with canRoomEditorManageVideoconference false', async () => {
					const { columnBoard, room } = setup();

					roomService.canEditorManageVideoconferences.mockReturnValueOnce(false);

					const result = await service.getBoardSettings(columnBoard);

					expect(result).toEqual({ canRoomEditorManageVideoconference: false });
					expect(roomService.canEditorManageVideoconferences).toHaveBeenCalledWith(room);
				});
			});
		});
	});
});
