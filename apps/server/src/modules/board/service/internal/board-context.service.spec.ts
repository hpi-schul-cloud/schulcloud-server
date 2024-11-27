import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission, RoleName } from '@shared/domain/interface';
import { CourseRepo } from '@shared/repo/course';
import { courseFactory, groupFactory, roleFactory, setupEntities, userFactory } from '@shared/testing';
import { GroupTypes } from '@src/modules/group';
import { RoomMemberService } from '@src/modules/room-member';
import { roomMemberFactory } from '@src/modules/room-member/testing';
import { roomFactory } from '@src/modules/room/testing';
import { BoardExternalReferenceType, BoardRoles, UserWithBoardRoles } from '../../domain';
import { columnBoardFactory, columnFactory } from '../../testing';
import { BoardContextService } from './board-context.service';

describe(`${BoardContextService.name}`, () => {
	let module: TestingModule;
	let service: BoardContextService;
	let courseRepo: DeepMocked<CourseRepo>;
	let roomMemberService: DeepMocked<RoomMemberService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardContextService,
				{
					provide: RoomMemberService,
					useValue: createMock<RoomMemberService>(),
				},
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
			],
		}).compile();

		service = module.get(BoardContextService);
		roomMemberService = module.get(RoomMemberService);
		courseRepo = module.get(CourseRepo);

		await setupEntities();
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
					const course = courseFactory.buildWithId({ teachers: [teacher] });
					const columnBoard = columnBoardFactory.build({
						context: { id: course.id, type: BoardExternalReferenceType.Course },
					});
					courseRepo.findById.mockResolvedValue(course);

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
					const course = courseFactory.buildWithId({ substitutionTeachers: [substitutionTeacher] });
					const columnBoard = columnBoardFactory.build({
						context: { id: course.id, type: BoardExternalReferenceType.Course },
					});
					courseRepo.findById.mockResolvedValue(course);

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
					const course = courseFactory.buildWithId({ students: [student] });
					const columnBoard = columnBoardFactory.build({
						context: { id: course.id, type: BoardExternalReferenceType.Course },
					});
					courseRepo.findById.mockResolvedValue(course);

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
					const course = courseFactory.buildWithId();
					const columnBoard = columnBoardFactory.build({
						context: { id: course.id, type: BoardExternalReferenceType.Course },
					});
					courseRepo.findById.mockResolvedValue(course);

					return { columnBoard };
				};

				it('should call the course repo', async () => {
					const { columnBoard } = setup();

					await service.getUsersWithBoardRoles(columnBoard);

					expect(courseRepo.findById).toHaveBeenCalledWith(columnBoard.context.id);
				});
			});
		});

		describe('when node has a room context', () => {
			describe('when user with editor role is associated with the room', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
					const role = roleFactory.build({ name: RoleName.ROOMEDITOR, permissions: [Permission.ROOM_EDIT] });
					const group = groupFactory.build({ type: GroupTypes.ROOM, users: [{ userId: user.id, roleId: role.id }] });
					const room = roomFactory.build();
					roomMemberFactory.build({ roomId: room.id, userGroupId: group.id });
					const columnBoard = columnBoardFactory.build({
						context: { id: room.id, type: BoardExternalReferenceType.Room },
					});

					return { columnBoard, role, user };
				};

				it('should return their information + editor role', async () => {
					const { columnBoard, role, user } = setup();

					roomMemberService.getRoomMemberAuthorizable.mockResolvedValue({
						id: 'foo',
						roomId: columnBoard.context.id,
						members: [{ userId: user.id, roles: [role] }],
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
					const role = roleFactory.build({ name: RoleName.ROOMVIEWER, permissions: [Permission.ROOM_VIEW] });
					const group = groupFactory.build({ type: GroupTypes.ROOM, users: [{ userId: user.id, roleId: role.id }] });
					const room = roomFactory.build();
					roomMemberFactory.build({ roomId: room.id, userGroupId: group.id });
					const columnBoard = columnBoardFactory.build({
						context: { id: room.id, type: BoardExternalReferenceType.Room },
					});

					return { columnBoard, role, user };
				};

				it('should return their information + reader role', async () => {
					const { columnBoard, role, user } = setup();

					roomMemberService.getRoomMemberAuthorizable.mockResolvedValue({
						id: 'foo',
						roomId: columnBoard.context.id,
						members: [{ userId: user.id, roles: [role] }],
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
					roomMemberFactory.build({ roomId: room.id, userGroupId: group.id });
					const columnBoard = columnBoardFactory.build({
						context: { id: room.id, type: BoardExternalReferenceType.Room },
					});

					return { columnBoard, role, user };
				};

				it('should return their information + no role', async () => {
					const { columnBoard, role, user } = setup();

					roomMemberService.getRoomMemberAuthorizable.mockResolvedValue({
						id: 'foo',
						roomId: columnBoard.context.id,
						members: [{ userId: user.id, roles: [role] }],
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
