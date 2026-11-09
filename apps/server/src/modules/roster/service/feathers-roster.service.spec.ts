import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { DatabaseObjectNotFoundException } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationService } from '@modules/authorization';
import { type AnyBoardNode, BoardExternalReferenceType, BoardNodeService, ColumnBoardService } from '@modules/board';
import { BoardNodeRule } from '@modules/board/authorisation/board-node.rule';
import {
	cardFactory,
	columnBoardFactory,
	columnFactory,
	externalToolElementFactory,
	mediaBoardFactory,
} from '@modules/board/testing';
import { CourseService } from '@modules/course';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { legacySchoolDoFactory } from '@modules/legacy-school/testing';
import { PseudonymService } from '@modules/pseudonym';
import { Pseudonym } from '@modules/pseudonym/repo';
import { pseudonymFactory } from '@modules/pseudonym/testing';
import { type RoleDto, RoleName } from '@modules/role';
import { RoomService } from '@modules/room';
import { RoomAuthorizable, RoomMembershipService, type UserWithRoomRoles } from '@modules/room-membership';
import { roomFactory } from '@modules/room/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { ToolContextType } from '@modules/tool/common/enum';
import { ContextExternalTool, ContextRef } from '@modules/tool/context-external-tool/domain';
import { ContextExternalToolType } from '@modules/tool/context-external-tool/repo/mikro-orm';
import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import { contextExternalToolFactory } from '@modules/tool/context-external-tool/testing';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { ExternalToolService } from '@modules/tool/external-tool/service';
import { externalToolFactory } from '@modules/tool/external-tool/testing';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { SchoolExternalToolService } from '@modules/tool/school-external-tool/service';
import { schoolExternalToolFactory } from '@modules/tool/school-external-tool/testing';
import { UserService } from '@modules/user';
import { userDoFactory, userFactory } from '@modules/user/testing';
import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { setupEntities } from '@testing/database';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { FeathersRosterService } from './feathers-roster.service';

import { Permission } from '@shared/domain/interface';
import { ROSTER_PUBLIC_API_CONFIG_TOKEN, RosterPublicApiConfig } from '../roster.config';
import { UnprocessableEntityException } from '@nestjs/common';

describe('FeathersRosterService', () => {
	let module: TestingModule;
	let service: FeathersRosterService;

	let userService: DeepMocked<UserService>;
	let pseudonymService: DeepMocked<PseudonymService>;
	let courseService: DeepMocked<CourseService>;
	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let columnBoardService: DeepMocked<ColumnBoardService>;
	let boardNodeService: DeepMocked<BoardNodeService>;
	let roomService: DeepMocked<RoomService>;
	let roomMembershipService: DeepMocked<RoomMembershipService>;
	let config: RosterPublicApiConfig;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				FeathersRosterService,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: PseudonymService,
					useValue: createMock<PseudonymService>(),
				},
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
				{
					provide: ContextExternalToolService,
					useValue: createMock<ContextExternalToolService>(),
				},
				{
					provide: ColumnBoardService,
					useValue: createMock<ColumnBoardService>(),
				},
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
				{
					provide: BoardNodeRule,
					useValue: createMock<BoardNodeRule>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: RoomService,
					useValue: createMock<RoomService>(),
				},
				{
					provide: RoomMembershipService,
					useValue: createMock<RoomMembershipService>(),
				},
				{
					provide: ROSTER_PUBLIC_API_CONFIG_TOKEN,
					useValue: new RosterPublicApiConfig(),
				},
			],
		}).compile();

		service = module.get(FeathersRosterService);
		pseudonymService = module.get(PseudonymService);
		userService = module.get(UserService);
		courseService = module.get(CourseService);
		externalToolService = module.get(ExternalToolService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		contextExternalToolService = module.get(ContextExternalToolService);
		columnBoardService = module.get(ColumnBoardService);
		boardNodeService = module.get(BoardNodeService);
		roomService = module.get(RoomService);
		roomMembershipService = module.get(RoomMembershipService);
		config = module.get(ROSTER_PUBLIC_API_CONFIG_TOKEN);

		await setupEntities([CourseEntity, CourseGroupEntity]);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	const mockBoardNodes = (nodes: AnyBoardNode[]): void => {
		boardNodeService.findByIds.mockImplementation((ids: string[]) =>
			Promise.resolve(nodes.filter((node) => ids.includes(node.id)))
		);
	};

	const boardMemberPermissions = [
		Permission.ROOM_LIST_CONTENT,
		Permission.ROOM_EDIT_CONTENT,
		Permission.ROOM_ADD_MEMBERS,
		Permission.ROOM_CHANGE_OWNER,
	];

	afterAll(async () => {
		await module.close();
	});

	describe('getUsersMetadata', () => {
		describe('when pseudonym is given', () => {
			const setup = () => {
				const pseudonym = pseudonymFactory.build();
				const user = userDoFactory.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }]).build();
				const iFrameSubject = 'iFrameSubject';

				pseudonymService.findOneByPseudonym.mockResolvedValue(pseudonym);
				userService.findById.mockResolvedValue(user);
				pseudonymService.getIframeSubject.mockReturnValue(iFrameSubject);

				return {
					pseudonym,
					user,
					iFrameSubject,
				};
			};

			it('should call the pseudonym service to find the pseudonym', async () => {
				const { pseudonym } = setup();

				await service.getUsersMetadata(pseudonym.pseudonym);

				expect(pseudonymService.findOneByPseudonym).toHaveBeenCalledWith(pseudonym.pseudonym);
			});

			it('should call the user service to find the user', async () => {
				const { pseudonym } = setup();

				await service.getUsersMetadata(pseudonym.pseudonym);

				expect(userService.findById).toHaveBeenCalledWith(pseudonym.userId);
			});

			it('should call the pseudonym service to get the iframe subject', async () => {
				const { pseudonym } = setup();

				await service.getUsersMetadata(pseudonym.pseudonym);

				expect(pseudonymService.getIframeSubject).toHaveBeenCalledWith(pseudonym.pseudonym);
			});

			it('should return user metadata', async () => {
				const { pseudonym, user, iFrameSubject } = setup();

				const result = await service.getUsersMetadata(pseudonym.pseudonym);

				expect(result).toEqual({
					data: {
						user_id: user.id,
						username: iFrameSubject,
						type: 'student',
					},
				});
			});
		});

		describe('when pseudonym does not exists', () => {
			const setup = () => {
				const pseudonym = pseudonymFactory.build();

				pseudonymService.findOneByPseudonym.mockResolvedValue(null);

				return {
					pseudonym,
				};
			};

			it('should throw an NotFoundLoggableException', async () => {
				const { pseudonym } = setup();

				const func = service.getUsersMetadata(pseudonym.pseudonym);

				await expect(func).rejects.toThrow(
					new NotFoundLoggableException(Pseudonym.name, { pseudonym: pseudonym.pseudonym })
				);
			});
		});

		describe('when user does not exists', () => {
			const setup = () => {
				const pseudonym = pseudonymFactory.build();
				const user = userDoFactory.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }]).build();

				pseudonymService.findOneByPseudonym.mockResolvedValue(pseudonym);
				userService.findById.mockRejectedValueOnce(new DatabaseObjectNotFoundException(new Error()));

				return {
					pseudonym,
					user,
				};
			};

			it('should throw database exception', async () => {
				const { pseudonym } = setup();

				const func = service.getUsersMetadata(pseudonym.pseudonym);

				await expect(func).rejects.toThrow(DatabaseObjectNotFoundException);
			});
		});

		describe('getUsersMetadata for a teacher', () => {
			const setup = () => {
				const pseudonym = pseudonymFactory.build();
				const user = userDoFactory.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.TEACHER }]).build();

				pseudonymService.findOneByPseudonym.mockResolvedValue(pseudonym);
				userService.findById.mockResolvedValue(user);
				pseudonymService.getIframeSubject.mockReturnValue('iFrameSubject');

				return { pseudonym };
			};

			it('should return the teacher role as type', async () => {
				const { pseudonym } = setup();

				const result = await service.getUsersMetadata(pseudonym.pseudonym);

				expect(result.data.type).toEqual(RoleName.TEACHER);
			});
		});
	});

	describe('getUserGroups', () => {
		describe('when the tool is active in a course', () => {
			const setup = () => {
				const user = userDoFactory.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }]).build();
				const school = legacySchoolDoFactory.buildWithId({ id: user.schoolId });
				const courseA = courseEntityFactory.buildWithId();
				const courseB = courseEntityFactory.buildWithId();
				const courseC = courseEntityFactory.buildWithId();
				const courses = [courseA, courseB, courseC];

				const clientId = 'testClientId';
				const externalTool = externalToolFactory.withOauth2Config({ clientId }).buildWithId();
				const pseudonym = pseudonymFactory.build({ userId: user.id, toolId: externalTool.id });
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
					schoolId: school.id,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id, schoolExternalTool.schoolId)
					.buildWithId({
						contextRef: new ContextRef({
							id: courseA.id,
							type: ToolContextType.COURSE,
						}),
					});

				config.featureColumnBoardExternalToolsEnabled = false;

				pseudonymService.findOneByPseudonym.mockResolvedValue(pseudonym);
				userService.findById.mockResolvedValueOnce(user);
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([schoolExternalTool]);
				courseService.findAllByUserId.mockResolvedValue([courses, courses.length]);
				// Course A
				contextExternalToolService.findContextExternalTools.mockResolvedValueOnce([contextExternalTool]);
				columnBoardService.findByExternalReference.mockResolvedValueOnce([]);
				// Course B
				contextExternalToolService.findContextExternalTools.mockResolvedValueOnce([]);
				columnBoardService.findByExternalReference.mockResolvedValueOnce([]);
				// Course C
				contextExternalToolService.findContextExternalTools.mockResolvedValueOnce([]);

				return {
					pseudonym,
					externalTool,
					clientId,
					user,
					courses,
					schoolExternalTool,
				};
			};

			it('should return a group for each course where the tool of the users pseudonym is used', async () => {
				const { pseudonym, clientId, courses } = setup();

				const result = await service.getUserGroups(pseudonym.pseudonym, clientId);

				expect(result).toEqual({
					data: {
						groups: [
							{
								group_id: courses[0].id,
								name: courses[0].name,
								student_count: courses[0].students.count(),
							},
						],
					},
				});
			});
		});

		describe('when the tool is active in a column board of a course', () => {
			const setup = (
				membership: 'student' | 'teacher' | 'substitutionTeacher' | 'none' = 'student',
				isVisible = true,
				hasTeacher = true
			) => {
				const user = userDoFactory.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }]).build();
				const school = legacySchoolDoFactory.buildWithId({ id: user.schoolId });

				const member = userFactory.buildWithId();
				user.id = member.id;
				const teacher = membership === 'teacher' ? member : userFactory.buildWithId();
				const courseA = courseEntityFactory.buildWithId({
					students: membership === 'student' ? [member] : [],
					teachers: hasTeacher ? [teacher] : [],
					substitutionTeachers: membership === 'substitutionTeacher' ? [member] : [],
				});
				const courseB = courseEntityFactory.buildWithId();
				const courseC = courseEntityFactory.buildWithId();
				const courses = [courseA, courseB, courseC];

				const clientId = 'testClientId';
				const externalTool = externalToolFactory.withOauth2Config({ clientId }).buildWithId();
				const pseudonym = pseudonymFactory.build({ userId: user.id, toolId: externalTool.id });
				const otherExternalTool = externalToolFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
					schoolId: school.id,
				});
				const otherSchoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: otherExternalTool.id,
					schoolId: school.id,
				});

				const externalToolElement = externalToolElementFactory.build();
				const otherExternalToolElement = externalToolElementFactory.build();
				const emptyExternalToolElement = externalToolElementFactory.build({
					contextExternalToolId: undefined,
				});
				const card = cardFactory.build({
					children: [externalToolElement, otherExternalToolElement, emptyExternalToolElement],
				});
				const column = columnFactory.build({ children: [card] });
				const columnBoard = columnBoardFactory.build({
					children: [column],
					context: { id: courseA.id, type: BoardExternalReferenceType.Course },
					isVisible,
				});

				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id, schoolExternalTool.schoolId)
					.buildWithId({
						contextRef: new ContextRef({
							id: courseA.id,
							type: ToolContextType.BOARD_ELEMENT,
						}),
					});
				externalToolElement.contextExternalToolId = contextExternalTool.id;
				const otherContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(otherSchoolExternalTool.id, otherSchoolExternalTool.schoolId)
					.buildWithId({
						contextRef: new ContextRef({
							id: courseA.id,
							type: ToolContextType.BOARD_ELEMENT,
						}),
					});
				otherExternalToolElement.contextExternalToolId = otherContextExternalTool.id;

				pseudonymService.findOneByPseudonym.mockResolvedValue(pseudonym);
				userService.findById.mockResolvedValueOnce(user);
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([schoolExternalTool]);
				courseService.findAllByUserId.mockResolvedValue([courses, courses.length]);
				// Course A
				contextExternalToolService.findContextExternalTools.mockResolvedValueOnce([]);
				columnBoardService.findByExternalReference.mockResolvedValueOnce([columnBoard]);
				contextExternalToolService.findById.mockResolvedValueOnce(contextExternalTool);
				contextExternalToolService.findById.mockResolvedValueOnce(otherContextExternalTool);
				// Course B
				contextExternalToolService.findContextExternalTools.mockResolvedValueOnce([]);
				columnBoardService.findByExternalReference.mockResolvedValueOnce([]);
				// Course C
				contextExternalToolService.findContextExternalTools.mockResolvedValueOnce([]);
				columnBoardService.findByExternalReference.mockResolvedValueOnce([]);

				config.featureColumnBoardExternalToolsEnabled = true;

				return {
					pseudonym,
					externalTool,
					clientId,
					user,
					courseA,
					schoolExternalTool,
					otherSchoolExternalTool,
					otherExternalTool,
				};
			};

			it('should return a group for each course where the tool of the users pseudonym is used', async () => {
				const { pseudonym, clientId, courseA } = setup();

				const result = await service.getUserGroups(pseudonym.pseudonym, clientId);

				expect(result).toEqual({
					data: {
						groups: [
							{
								group_id: courseA.id,
								name: courseA.name,
								student_count: courseA.students.count(),
							},
						],
					},
				});
			});

			it.each([
				{ membership: 'teacher', isVisible: false },
				{ membership: 'substitutionTeacher', isVisible: false },
				{ membership: 'teacher', isVisible: true },
				{ membership: 'substitutionTeacher', isVisible: true },
			] as const)(
				'should include a board for $membership when isVisible=$isVisible',
				async ({ membership, isVisible }) => {
					const { pseudonym, clientId, courseA } = setup(membership, isVisible);

					const result = await service.getUserGroups(pseudonym.pseudonym, clientId);

					expect(result.data.groups).toEqual([
						{ group_id: courseA.id, name: courseA.name, student_count: courseA.students.count() },
					]);
				}
			);

			it.each([
				{ membership: 'student', isVisible: false, hasTeacher: true },
				{ membership: 'none', isVisible: true, hasTeacher: true },
				{ membership: 'none', isVisible: false, hasTeacher: true },
				{ membership: 'student', isVisible: true, hasTeacher: false },
				{ membership: 'substitutionTeacher', isVisible: true, hasTeacher: false },
				{ membership: 'substitutionTeacher', isVisible: false, hasTeacher: false },
			] as const)(
				'should exclude a board for $membership when isVisible=$isVisible and hasTeacher=$hasTeacher',
				async ({ membership, isVisible, hasTeacher }) => {
					const { pseudonym, clientId } = setup(membership, isVisible, hasTeacher);

					await expect(service.getUserGroups(pseudonym.pseudonym, clientId)).rejects.toThrow(
						new NotFoundLoggableException(ExternalTool.name, { 'config.clientId': clientId })
					);
					expect(contextExternalToolService.findById).not.toHaveBeenCalled();
				}
			);
		});

		describe('when the tool is active in a column board of a room', () => {
			const setup = () => {
				const user = userDoFactory.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }]).build();
				user.id = new ObjectId().toHexString();

				const school = legacySchoolDoFactory.buildWithId({ id: user.schoolId });

				const room = roomFactory.build({ schoolId: school.id });

				const clientId = 'testClientId';
				const externalTool = externalToolFactory.withOauth2Config({ clientId }).buildWithId();
				const pseudonym = pseudonymFactory.build({ userId: user.id, toolId: externalTool.id });
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
					schoolId: school.id,
				});

				const externalToolElement = externalToolElementFactory.build();
				const emptyExternalToolElement = externalToolElementFactory.build({
					contextExternalToolId: undefined,
				});

				const card = cardFactory.build({
					children: [externalToolElement, emptyExternalToolElement],
				});
				const column = columnFactory.build({ children: [card] });
				const columnBoard = columnBoardFactory.build({
					children: [column],
					context: { id: room.id, type: BoardExternalReferenceType.Room },
				});
				const toolElementNode = externalToolElementFactory.build({
					id: externalToolElement.id,
					path: `,${columnBoard.id},${column.id},${card.id},`,
					level: 3,
				});

				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id, schoolExternalTool.schoolId)
					.buildWithId({
						contextRef: new ContextRef({
							id: externalToolElement.id,
							type: ToolContextType.BOARD_ELEMENT,
						}),
					});
				externalToolElement.contextExternalToolId = contextExternalTool.id;
				toolElementNode.contextExternalToolId = contextExternalTool.id;

				config.featureColumnBoardExternalToolsEnabled = true;

				pseudonymService.findOneByPseudonym.mockResolvedValueOnce(pseudonym);
				userService.findById.mockResolvedValue(user);
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValueOnce(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([schoolExternalTool]);

				roomService.getSingleRoom.mockResolvedValueOnce(room);

				courseService.findAllByUserId.mockResolvedValue([[], 0]);

				const roleDto: RoleDto = {
					id: 'role-id',
					name: RoleName.ROOMOWNER,
					permissions: [Permission.ROOM_EDIT_ROOM, ...boardMemberPermissions],
				};
				const members = [
					{
						roles: [roleDto],
						userId: user.id,
						userSchoolId: user.schoolId,
					},
				];
				const roomAuthorizable = new RoomAuthorizable(room.id, members, room.schoolId);
				roomMembershipService.getRoomAuthorizablesByUserId.mockResolvedValueOnce([roomAuthorizable]);

				roomService.getRoomsByIds.mockResolvedValueOnce([room]);
				userService.findByIds.mockResolvedValueOnce([user]);

				contextExternalToolService.findBySchoolToolIdsAndContextType.mockResolvedValueOnce([contextExternalTool]);
				mockBoardNodes([toolElementNode, columnBoard]);

				return {
					pseudonym,
					externalTool,
					clientId,
					user,
					room,
					schoolExternalTool,
					roomAuthorizable,
				};
			};

			it('should call roomMembershipService to get the room membership for the user', async () => {
				const { pseudonym, clientId } = setup();

				await service.getUserGroups(pseudonym.pseudonym, clientId);

				expect(roomMembershipService.getRoomAuthorizablesByUserId).toHaveBeenCalledWith(pseudonym.userId);
			});

			it('should call roomService to get all the rooms', async () => {
				const { pseudonym, clientId, room } = setup();

				await service.getUserGroups(pseudonym.pseudonym, clientId);

				expect(roomService.getRoomsByIds).toHaveBeenCalledWith([room.id]);
			});

			it('should return a group for each room where the tool of the users pseudonym is used', async () => {
				const { pseudonym, clientId, room } = setup();

				const result = await service.getUserGroups(pseudonym.pseudonym, clientId);

				expect(result).toEqual({
					data: {
						groups: [
							{
								group_id: room.id,
								name: room.name,
								student_count: 1, // Assuming the user is the only student in the room
							},
						],
					},
				});
			});

			it('should resolve the root boards of the tool elements by id without loading descendants', async () => {
				const { pseudonym, clientId } = setup();

				await service.getUserGroups(pseudonym.pseudonym, clientId);

				expect(boardNodeService.findByIds).toHaveBeenCalledTimes(2);
				expect(boardNodeService.findByIds).toHaveBeenNthCalledWith(1, expect.any(Array), 0);
				expect(boardNodeService.findByIds).toHaveBeenNthCalledWith(2, expect.any(Array), 0);
			});

			it('should exclude room groups when the requesting user has no board access in the room', async () => {
				const { pseudonym, clientId, room, roomAuthorizable } = setup();
				const memberWithoutPermissions = {
					...roomAuthorizable.members[0],
					roles: [{ id: 'role-id', name: RoleName.ROOMOWNER, permissions: [] }],
				};
				roomMembershipService.getRoomAuthorizablesByUserId.mockReset();
				roomMembershipService.getRoomAuthorizablesByUserId.mockResolvedValueOnce([
					new RoomAuthorizable(room.id, [memberWithoutPermissions], room.schoolId),
				]);

				await expect(service.getUserGroups(pseudonym.pseudonym, clientId)).rejects.toThrow(
					new NotFoundLoggableException(ExternalTool.name, { 'config.clientId': clientId })
				);
			});
		});

		describe('when pseudonym does not exists', () => {
			const setup = () => {
				const pseudonym = pseudonymFactory.build();

				pseudonymService.findOneByPseudonym.mockResolvedValue(null);

				return {
					pseudonym,
				};
			};

			it('should throw an NotFoundLoggableException', async () => {
				const { pseudonym } = setup();

				const func = service.getUserGroups(pseudonym.pseudonym, 'externalToolId');

				await expect(func).rejects.toThrow(
					new NotFoundLoggableException(Pseudonym.name, { pseudonym: pseudonym.pseudonym })
				);
			});
		});

		describe('when the external tool does not exist', () => {
			const setup = () => {
				const user = userDoFactory.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }]).build();
				const pseudonym = pseudonymFactory.build({ userId: user.id });

				pseudonymService.findOneByPseudonym.mockResolvedValue(pseudonym);
				userService.findById.mockResolvedValueOnce(user);
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(null);

				return {
					pseudonym,
				};
			};

			it('should throw an error', async () => {
				const { pseudonym } = setup();

				await expect(service.getUserGroups(pseudonym.pseudonym, 'clientId')).rejects.toThrow(
					new NotFoundLoggableException(ExternalTool.name, { 'config.clientId': 'clientId' })
				);
			});
		});

		describe('when the external tool is deactivated', () => {
			const setup = () => {
				const user = userDoFactory.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }]).build();
				const pseudonym = pseudonymFactory.build({ userId: user.id });

				const clientId = 'testClientId';
				const externalTool: ExternalTool = externalToolFactory
					.withOauth2Config({ clientId })
					.buildWithId({ isDeactivated: true });

				pseudonymService.findOneByPseudonym.mockResolvedValue(pseudonym);
				userService.findById.mockResolvedValueOnce(user);
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(externalTool);

				return {
					pseudonym,
					clientId,
				};
			};

			it('should throw an error', async () => {
				const { pseudonym, clientId } = setup();

				await expect(service.getUserGroups(pseudonym.pseudonym, clientId)).rejects.toThrow(
					new NotFoundLoggableException(ExternalTool.name, { 'config.clientId': clientId })
				);
			});
		});

		describe('when the school external tool does not exist or is deactivated', () => {
			const setup = () => {
				const user = userDoFactory.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }]).build();

				const clientId = 'testClientId';
				const externalTool = externalToolFactory.withOauth2Config({ clientId }).buildWithId();
				const pseudonym = pseudonymFactory.build({ userId: user.id, toolId: externalTool.id });

				pseudonymService.findOneByPseudonym.mockResolvedValue(pseudonym);
				userService.findById.mockResolvedValueOnce(user);
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([]);

				return {
					pseudonym,
					externalTool,
				};
			};

			it('should throw an error', async () => {
				const { pseudonym, externalTool } = setup();

				await expect(service.getUserGroups(pseudonym.pseudonym, 'clientId')).rejects.toThrow(
					new NotFoundLoggableException(SchoolExternalTool.name, { toolId: externalTool.id })
				);
			});
		});

		describe('when the pseudonym does not match the tool', () => {
			const setup = () => {
				const clientId = 'testClientId';
				const externalTool = externalToolFactory.withOauth2Config({ clientId }).buildWithId();
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValueOnce(externalTool);

				const pseudonym = pseudonymFactory.build({ toolId: 'some string' });
				pseudonymService.findOneByPseudonym.mockResolvedValue(pseudonym);

				return { clientId, pseudonym, externalTool };
			};

			it('should throw an error', async () => {
				const { pseudonym, clientId } = setup();
				await expect(service.getUserGroups(pseudonym.pseudonym, clientId)).rejects.toThrow(
					new UnprocessableEntityException(ExternalTool.name)
				);
			});
		});

		describe('getUserGroups for rooms', () => {
			const buildRole = (name: RoleName, permissions: Permission[] = []): RoleDto => {
				return { id: new ObjectId().toHexString(), name, permissions };
			};

			const buildToolElementNode = (boardId: string, contextExternalToolId: string): AnyBoardNode =>
				externalToolElementFactory.build({
					path: `,${boardId},${new ObjectId().toHexString()},${new ObjectId().toHexString()},`,
					level: 3,
					contextExternalToolId,
				});

			// places the tool (via a new context external tool and element) on the given board only
			const mockToolOnBoard = (board: AnyBoardNode): void => {
				const toolElementNode = buildToolElementNode(board.id, new ObjectId().toHexString());
				contextExternalToolService.findBySchoolToolIdsAndContextType.mockResolvedValue([
					contextExternalToolFactory.buildWithId({
						contextRef: new ContextRef({ id: toolElementNode.id, type: ToolContextType.BOARD_ELEMENT }),
					}),
				]);
				mockBoardNodes([toolElementNode, board]);
			};

			const setup = () => {
				const owner = userDoFactory.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.TEACHER }]).build();
				owner.id = new ObjectId().toHexString();
				const student = userDoFactory.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }]).build();
				student.id = new ObjectId().toHexString();

				const room = roomFactory.build({ schoolId: owner.schoolId });
				const clientId = 'testClientId';
				const externalTool = externalToolFactory.withOauth2Config({ clientId }).buildWithId();
				const pseudonym = pseudonymFactory.build({ userId: owner.id, toolId: externalTool.id });
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
					schoolId: room.schoolId,
				});
				const columnBoard = columnBoardFactory.build({
					context: { id: room.id, type: BoardExternalReferenceType.Room },
				});
				const contextExternalToolId = new ObjectId().toHexString();
				const toolElementNode = buildToolElementNode(columnBoard.id, contextExternalToolId);
				const contextExternalTool = contextExternalToolFactory.buildWithId({
					id: contextExternalToolId,
					contextRef: new ContextRef({ id: toolElementNode.id, type: ToolContextType.BOARD_ELEMENT }),
				});
				const roomAuthorizable = new RoomAuthorizable(
					room.id,
					[
						{
							roles: [buildRole(RoleName.ROOMOWNER, boardMemberPermissions)],
							userId: owner.id,
							userSchoolId: owner.schoolId,
						},
						{
							roles: [buildRole(RoleName.ROOMVIEWER, [Permission.ROOM_LIST_CONTENT])],
							userId: student.id,
							userSchoolId: student.schoolId,
						},
					],
					room.schoolId
				);

				config.featureColumnBoardExternalToolsEnabled = true;

				pseudonymService.findOneByPseudonym.mockResolvedValue(pseudonym);
				userService.findById.mockResolvedValue(owner);
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([schoolExternalTool]);
				courseService.findAllByUserId.mockResolvedValue([[], 0]);
				roomMembershipService.getRoomAuthorizablesByUserId.mockResolvedValue([roomAuthorizable]);
				roomService.getRoomsByIds.mockResolvedValue([room]);
				contextExternalToolService.findBySchoolToolIdsAndContextType.mockResolvedValue([contextExternalTool]);
				mockBoardNodes([toolElementNode, columnBoard]);
				userService.findByIds.mockResolvedValue([owner, student]);

				const expectedGroups = {
					data: { groups: [{ group_id: room.id, name: room.name, student_count: 1 }] },
				};
				const notFoundError = new NotFoundLoggableException(ExternalTool.name, { 'config.clientId': clientId });

				return {
					owner,
					student,
					room,
					clientId,
					pseudonym,
					schoolExternalTool,
					contextExternalTool,
					columnBoard,
					toolElementNode,
					expectedGroups,
					notFoundError,
				};
			};

			describe('when the room is eligible', () => {
				it('should count only members with a student role', async () => {
					const { pseudonym, clientId, expectedGroups } = setup();

					const result = await service.getUserGroups(pseudonym.pseudonym, clientId);

					expect(result).toEqual(expectedGroups);
				});

				it('should load all room members with a single batched user lookup', async () => {
					const { pseudonym, clientId, owner, student } = setup();

					await service.getUserGroups(pseudonym.pseudonym, clientId);

					expect(userService.findByIds).toHaveBeenCalledTimes(1);
					expect(userService.findByIds).toHaveBeenCalledWith([owner.id, student.id]);
				});

				it('should not load room memberships per room', async () => {
					const { pseudonym, clientId } = setup();

					await service.getUserGroups(pseudonym.pseudonym, clientId);

					expect(roomMembershipService.getRoomAuthorizable).not.toHaveBeenCalled();
				});

				it('should not load boards per room', async () => {
					const { pseudonym, clientId } = setup();

					await service.getUserGroups(pseudonym.pseudonym, clientId);

					expect(columnBoardService.findByExternalReference).not.toHaveBeenCalled();
				});

				it('should look up context external tools of the school external tool on board elements', async () => {
					const { pseudonym, clientId, schoolExternalTool } = setup();

					await service.getUserGroups(pseudonym.pseudonym, clientId);

					expect(contextExternalToolService.findBySchoolToolIdsAndContextType).toHaveBeenCalledWith(
						[schoolExternalTool.id],
						ContextExternalToolType.BOARD_ELEMENT
					);
				});

				it('should resolve the tool elements and their root boards by id', async () => {
					const { pseudonym, clientId, toolElementNode, columnBoard } = setup();

					await service.getUserGroups(pseudonym.pseudonym, clientId);

					expect(boardNodeService.findByIds).toHaveBeenNthCalledWith(1, [toolElementNode.id], 0);
					expect(boardNodeService.findByIds).toHaveBeenNthCalledWith(2, [columnBoard.id], 0);
				});
			});

			describe('when there are more tool elements than the batch size', () => {
				it('should load the elements in batches', async () => {
					const { pseudonym, clientId, columnBoard, toolElementNode, contextExternalTool, expectedGroups } = setup();
					const additionalTools = Array.from({ length: 500 }, () =>
						contextExternalToolFactory.buildWithId({
							contextRef: new ContextRef({
								id: new ObjectId().toHexString(),
								type: ToolContextType.BOARD_ELEMENT,
							}),
						})
					);
					contextExternalToolService.findBySchoolToolIdsAndContextType.mockResolvedValue([
						contextExternalTool,
						...additionalTools,
					]);
					mockBoardNodes([toolElementNode, columnBoard]);

					const result = await service.getUserGroups(pseudonym.pseudonym, clientId);

					expect(result).toEqual(expectedGroups);
					// 2 batches for the elements, 1 for the root boards
					expect(boardNodeService.findByIds).toHaveBeenCalledTimes(3);
				});
			});

			describe('when the user has no rooms', () => {
				it('should not load any rooms', async () => {
					const { pseudonym, clientId, notFoundError } = setup();
					roomMembershipService.getRoomAuthorizablesByUserId.mockResolvedValue([]);

					await expect(service.getUserGroups(pseudonym.pseudonym, clientId)).rejects.toThrow(notFoundError);
					expect(roomService.getRoomsByIds).not.toHaveBeenCalled();
				});
			});

			describe('when a loaded room has no matching membership', () => {
				it('should ignore that room', async () => {
					const { pseudonym, clientId, owner, room, expectedGroups } = setup();
					const roomWithoutMembership = roomFactory.build({ schoolId: owner.schoolId });
					roomService.getRoomsByIds.mockResolvedValue([room, roomWithoutMembership]);

					const result = await service.getUserGroups(pseudonym.pseudonym, clientId);

					expect(result).toEqual(expectedGroups);
				});
			});

			describe('when the room has no owner', () => {
				it('should ignore the room', async () => {
					const { pseudonym, clientId, room, student, notFoundError } = setup();
					roomMembershipService.getRoomAuthorizablesByUserId.mockResolvedValue([
						new RoomAuthorizable(
							room.id,
							[
								{
									roles: [buildRole(RoleName.ROOMVIEWER)],
									userId: student.id as string,
									userSchoolId: student.schoolId,
								},
							],
							room.schoolId
						),
					]);

					await expect(service.getUserGroups(pseudonym.pseudonym, clientId)).rejects.toThrow(notFoundError);
				});
			});

			describe('when the school of the room has no active school external tool', () => {
				it('should ignore the room', async () => {
					const { pseudonym, clientId, notFoundError } = setup();
					schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([]);

					await expect(service.getUserGroups(pseudonym.pseudonym, clientId)).rejects.toThrow(notFoundError);
					expect(contextExternalToolService.findBySchoolToolIdsAndContextType).not.toHaveBeenCalled();
					expect(boardNodeService.findByIds).not.toHaveBeenCalled();
				});
			});

			describe('when the tool element cannot be found', () => {
				it('should ignore the room', async () => {
					const { pseudonym, clientId, notFoundError } = setup();
					mockBoardNodes([]);

					await expect(service.getUserGroups(pseudonym.pseudonym, clientId)).rejects.toThrow(notFoundError);
				});
			});

			describe('when the board root node is not a column board', () => {
				it('should ignore the room', async () => {
					const { pseudonym, clientId, notFoundError } = setup();
					mockToolOnBoard(mediaBoardFactory.build());

					await expect(service.getUserGroups(pseudonym.pseudonym, clientId)).rejects.toThrow(notFoundError);
					expect(boardNodeService.findByIds).toHaveBeenCalledTimes(2);
				});
			});

			describe('when the tool is on a board of a room the user is not member of', () => {
				it('should ignore the room', async () => {
					const { pseudonym, clientId, notFoundError } = setup();
					mockToolOnBoard(
						columnBoardFactory.build({
							context: { id: new ObjectId().toHexString(), type: BoardExternalReferenceType.Room },
						})
					);

					await expect(service.getUserGroups(pseudonym.pseudonym, clientId)).rejects.toThrow(notFoundError);
					expect(userService.findByIds).not.toHaveBeenCalled();
				});
			});

			describe('when the tool is on a board of a course', () => {
				it('should ignore the board', async () => {
					const { pseudonym, clientId, room, notFoundError } = setup();
					mockToolOnBoard(
						columnBoardFactory.build({ context: { id: room.id, type: BoardExternalReferenceType.Course } })
					);

					await expect(service.getUserGroups(pseudonym.pseudonym, clientId)).rejects.toThrow(notFoundError);
				});
			});

			describe('when the tool is on multiple boards of the same room', () => {
				it('should return the room only once', async () => {
					const { pseudonym, clientId, room, columnBoard, toolElementNode, contextExternalTool, expectedGroups } =
						setup();
					const secondBoard = columnBoardFactory.build({
						context: { id: room.id, type: BoardExternalReferenceType.Room },
					});
					const secondElement = buildToolElementNode(secondBoard.id, new ObjectId().toHexString());
					contextExternalToolService.findBySchoolToolIdsAndContextType.mockResolvedValue([
						contextExternalTool,
						contextExternalToolFactory.buildWithId({
							contextRef: new ContextRef({ id: secondElement.id, type: ToolContextType.BOARD_ELEMENT }),
						}),
					]);
					mockBoardNodes([toolElementNode, columnBoard, secondElement, secondBoard]);

					const result = await service.getUserGroups(pseudonym.pseudonym, clientId);

					expect(result).toEqual(expectedGroups);
				});
			});

			describe('when checking the board access of the requesting user', () => {
				const setupRequestingMember = (roles: RoleDto[], isBoardVisible = true) => {
					const { pseudonym, clientId, room, owner, notFoundError } = setup();
					const member = userDoFactory
						.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }])
						.build({ id: new ObjectId().toHexString() });

					pseudonymService.findOneByPseudonym.mockResolvedValue(
						pseudonymFactory.build({ userId: member.id, toolId: pseudonym.toolId })
					);
					roomMembershipService.getRoomAuthorizablesByUserId.mockResolvedValue([
						new RoomAuthorizable(
							room.id,
							[
								{
									roles: [buildRole(RoleName.ROOMOWNER, boardMemberPermissions)],
									userId: owner.id as string,
									userSchoolId: owner.schoolId,
								},
								{ roles, userId: member.id as string, userSchoolId: member.schoolId },
							],
							room.schoolId
						),
					]);
					userService.findByIds.mockResolvedValue([owner, member]);
					mockToolOnBoard(
						columnBoardFactory.build({
							isVisible: isBoardVisible,
							context: { id: room.id, type: BoardExternalReferenceType.Room },
						})
					);

					const expectedGroups = {
						data: { groups: [{ group_id: room.id, name: room.name, student_count: 1 }] },
					};

					return { pseudonym, clientId, notFoundError, expectedGroups };
				};

				describe('when the board is visible', () => {
					it('should include the room for a room reader', async () => {
						const { pseudonym, clientId, expectedGroups } = setupRequestingMember(
							[buildRole(RoleName.ROOMVIEWER, [Permission.ROOM_LIST_CONTENT])],
							true
						);

						const result = await service.getUserGroups(pseudonym.pseudonym, clientId);

						expect(result).toEqual(expectedGroups);
					});
				});

				describe('when the board is not visible', () => {
					it('should ignore the room for a room reader', async () => {
						const { pseudonym, clientId, notFoundError } = setupRequestingMember(
							[buildRole(RoleName.ROOMVIEWER, [Permission.ROOM_LIST_CONTENT])],
							false
						);

						await expect(service.getUserGroups(pseudonym.pseudonym, clientId)).rejects.toThrow(notFoundError);
					});
				});

				describe.each([true, false])('when the board visibility is %s', (isBoardVisible: boolean) => {
					it.each([
						['editor', Permission.ROOM_EDIT_CONTENT],
						['admin', Permission.ROOM_ADD_MEMBERS],
						['owner', Permission.ROOM_CHANGE_OWNER],
					])('should include the room for a room %s', async (_role: string, permission: Permission) => {
						const { pseudonym, clientId, expectedGroups } = setupRequestingMember(
							[buildRole(RoleName.ROOMVIEWER, [permission])],
							isBoardVisible
						);

						const result = await service.getUserGroups(pseudonym.pseudonym, clientId);

						expect(result).toEqual(expectedGroups);
					});

					it('should ignore the room when the user has no board relevant permissions', async () => {
						const { pseudonym, clientId, notFoundError } = setupRequestingMember(
							[buildRole(RoleName.ROOMVIEWER, [Permission.ROOM_EDIT_ROOM])],
							isBoardVisible
						);

						await expect(service.getUserGroups(pseudonym.pseudonym, clientId)).rejects.toThrow(notFoundError);
					});
				});

				it('should ignore the room when the role has no permissions', async () => {
					const { pseudonym, clientId, notFoundError } = setupRequestingMember([
						{ id: new ObjectId().toHexString(), name: RoleName.ROOMVIEWER },
					]);

					await expect(service.getUserGroups(pseudonym.pseudonym, clientId)).rejects.toThrow(notFoundError);
				});

				it('should ignore the room when the user is not a member of it', async () => {
					const { pseudonym, clientId, notFoundError } = setup();
					pseudonymService.findOneByPseudonym.mockResolvedValue(
						pseudonymFactory.build({ userId: new ObjectId().toHexString(), toolId: pseudonym.toolId })
					);

					await expect(service.getUserGroups(pseudonym.pseudonym, clientId)).rejects.toThrow(notFoundError);
				});
			});

			describe('when no context external tools exist on board elements', () => {
				it('should ignore the room without loading board nodes', async () => {
					const { pseudonym, clientId, notFoundError } = setup();
					contextExternalToolService.findBySchoolToolIdsAndContextType.mockResolvedValue([]);

					await expect(service.getUserGroups(pseudonym.pseudonym, clientId)).rejects.toThrow(notFoundError);
					expect(boardNodeService.findByIds).not.toHaveBeenCalled();
				});
			});
		});
	});

	describe('getGroup', () => {
		describe('when trying to get a course', () => {
			describe('when the tool is active in a course', () => {
				const setup = () => {
					const schoolEntity = schoolEntityFactory.buildWithId();
					const school = legacySchoolDoFactory.build({ id: schoolEntity.id });

					const externalTool = externalToolFactory.buildWithId();
					const schoolExternalTool = schoolExternalToolFactory.buildWithId({
						toolId: externalTool.id,
						schoolId: school.id,
					});

					const { studentUser } = UserAndAccountTestFactory.buildStudent();
					const student1 = userDoFactory.build({ id: studentUser.id });
					const student1Pseudonym = pseudonymFactory.build({
						userId: student1.id,
						toolId: externalTool.id,
					});

					const { studentUser: studentUser2 } = UserAndAccountTestFactory.buildStudent();
					const student2 = userDoFactory.build({ id: studentUser2.id });
					const student2Pseudonym = pseudonymFactory.build({
						userId: student2.id,
						toolId: externalTool.id,
					});

					const { teacherUser } = UserAndAccountTestFactory.buildTeacher();
					const teacher = userDoFactory.build({ id: teacherUser.id });
					const teacherPseudonym = pseudonymFactory.build({
						userId: teacher.id,
						toolId: externalTool.id,
					});

					const { teacherUser: substitutionTeacherUser } = UserAndAccountTestFactory.buildTeacher();
					const substitutionTeacher = userDoFactory.build({ id: substitutionTeacherUser.id });
					const substitutionTeacherPseudonym = pseudonymFactory.build({
						userId: substitutionTeacher.id,
						toolId: externalTool.id,
					});

					const courseA = courseEntityFactory.buildWithId({
						school: schoolEntity,
						students: [studentUser, studentUser2],
						teachers: [teacherUser],
						substitutionTeachers: [substitutionTeacherUser],
						classes: [],
						groups: [],
					});

					const contextExternalTool = contextExternalToolFactory
						.withSchoolExternalToolRef(schoolExternalTool.id, schoolExternalTool.schoolId)
						.buildWithId({
							contextRef: new ContextRef({
								id: courseA.id,
								type: ToolContextType.COURSE,
							}),
						});

					config.featureColumnBoardExternalToolsEnabled = false;

					courseService.findById.mockResolvedValue(courseA);
					externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(externalTool);
					schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([schoolExternalTool]);
					contextExternalToolService.findContextExternalTools.mockResolvedValueOnce([contextExternalTool]);

					userService.findById.mockResolvedValueOnce(student1);
					pseudonymService.findOrCreatePseudonym.mockResolvedValueOnce(student1Pseudonym);
					userService.findById.mockResolvedValueOnce(student2);
					pseudonymService.findOrCreatePseudonym.mockResolvedValueOnce(student2Pseudonym);
					userService.findById.mockResolvedValueOnce(teacher);
					pseudonymService.findOrCreatePseudonym.mockResolvedValueOnce(teacherPseudonym);
					userService.findById.mockResolvedValueOnce(substitutionTeacher);
					pseudonymService.findOrCreatePseudonym.mockResolvedValueOnce(substitutionTeacherPseudonym);

					const mockedIframeSubject = 'mockedIframeSubject';
					pseudonymService.getIframeSubject.mockReturnValue(mockedIframeSubject);

					roomService.roomExists.mockResolvedValueOnce(false);

					return {
						externalTool,
						courseA,
						schoolExternalTool,
						mockedIframeSubject,
						student1,
						student2,
						teacher,
						substitutionTeacher,
						student1Pseudonym,
						student2Pseudonym,
						teacherPseudonym,
						substitutionTeacherPseudonym,
					};
				};

				it('should call the course service to find the course', async () => {
					const { externalTool, courseA } = setup();

					await service.getGroup(courseA.id, externalTool.id);

					expect(courseService.findById).toHaveBeenCalledWith(courseA.id);
				});

				it('should call the external tool service to find the external tool', async () => {
					const { externalTool, courseA } = setup();

					await service.getGroup(courseA.id, externalTool.id);

					expect(externalToolService.findExternalToolByOAuth2ConfigClientId).toHaveBeenCalledWith(externalTool.id);
				});

				it('should call the school external tool service to find the school external tool', async () => {
					const { externalTool, courseA, schoolExternalTool } = setup();

					await service.getGroup(courseA.id, externalTool.id);

					expect(schoolExternalToolService.findSchoolExternalTools).toHaveBeenCalledWith({
						schoolId: schoolExternalTool.schoolId,
						toolId: schoolExternalTool.toolId,
						isDeactivated: false,
					});
				});

				it('should call the user service to find the students', async () => {
					const { externalTool, courseA } = setup();

					await service.getGroup(courseA.id, externalTool.id);

					expect(userService.findById.mock.calls).toEqual([
						[courseA.students[0].id],
						[courseA.students[1].id],
						[courseA.teachers[0].id],
						[courseA.substitutionTeachers[0].id],
					]);
				});

				it('should call the pseudonym service to find the pseudonyms', async () => {
					const { externalTool, courseA, student1, student2, teacher, substitutionTeacher } = setup();

					await service.getGroup(courseA.id, externalTool.id);

					expect(pseudonymService.findOrCreatePseudonym.mock.calls).toEqual([
						[student1, externalTool],
						[student2, externalTool],
						[teacher, externalTool],
						[substitutionTeacher, externalTool],
					]);
				});

				it('should return a group for the course where the tool of the users pseudonym is used', async () => {
					const {
						externalTool,
						courseA,
						mockedIframeSubject,
						student1Pseudonym,
						student2Pseudonym,
						teacherPseudonym,
						substitutionTeacherPseudonym,
					} = setup();

					const result = await service.getGroup(courseA.id, externalTool.id);

					expect(result).toEqual({
						data: {
							students: [
								{
									user_id: student1Pseudonym.pseudonym,
									username: mockedIframeSubject,
								},
								{
									user_id: student2Pseudonym.pseudonym,
									username: mockedIframeSubject,
								},
							],
							teachers: [
								{
									user_id: teacherPseudonym.pseudonym,
									username: mockedIframeSubject,
								},
								{
									user_id: substitutionTeacherPseudonym.pseudonym,
									username: mockedIframeSubject,
								},
							],
						},
					});
				});
			});

			describe('when the tool is not active', () => {
				const setup = () => {
					const schoolEntity = schoolEntityFactory.buildWithId();
					const school = legacySchoolDoFactory.build({ id: schoolEntity.id });

					const externalTool = externalToolFactory.buildWithId();
					const schoolExternalTool = schoolExternalToolFactory.buildWithId({
						toolId: externalTool.id,
						schoolId: school.id,
					});

					const courseA = courseEntityFactory.buildWithId({
						school: schoolEntity,
						students: [],
						teachers: [],
						substitutionTeachers: [],
						classes: [],
						groups: [],
					});

					config.featureColumnBoardExternalToolsEnabled = false;

					courseService.findById.mockResolvedValue(courseA);
					externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(externalTool);
					schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([schoolExternalTool]);
					contextExternalToolService.findContextExternalTools.mockResolvedValueOnce([]);

					return {
						courseA,
						externalTool,
					};
				};

				it('should throw an NotFoundLoggableException', async () => {
					const { courseA } = setup();

					await expect(service.getGroup(courseA.id, 'externalToolId')).rejects.toThrow(
						new NotFoundLoggableException(ExternalTool.name, { 'config.clientId': 'externalToolId' })
					);
				});
			});

			describe('when the tool is active in a column board of a course', () => {
				const setup = () => {
					roomService.getSingleRoom.mockRejectedValueOnce(new Error('Room not found'));

					const schoolEntity = schoolEntityFactory.buildWithId();
					const school = legacySchoolDoFactory.build({ id: schoolEntity.id });

					const externalTool = externalToolFactory.withOauth2Config().buildWithId();
					const otherExternalTool = externalToolFactory.buildWithId();
					const schoolExternalTool = schoolExternalToolFactory.buildWithId({
						toolId: externalTool.id,
						schoolId: school.id,
					});
					const otherSchoolExternalTool = schoolExternalToolFactory.buildWithId({
						toolId: otherExternalTool.id,
						schoolId: school.id,
					});

					const { studentUser } = UserAndAccountTestFactory.buildStudent();
					const student1 = userDoFactory.build({ id: studentUser.id });
					const student1Pseudonym = pseudonymFactory.build({
						userId: student1.id,
						toolId: externalTool.id,
					});

					const { studentUser: studentUser2 } = UserAndAccountTestFactory.buildStudent();
					const student2 = userDoFactory.build({ id: studentUser2.id });
					const student2Pseudonym = pseudonymFactory.build({
						userId: student2.id,
						toolId: externalTool.id,
					});

					const { teacherUser } = UserAndAccountTestFactory.buildTeacher();
					const teacher = userDoFactory.build({ id: teacherUser.id });
					const teacherPseudonym = pseudonymFactory.build({
						userId: teacher.id,
						toolId: externalTool.id,
					});

					const { teacherUser: substitutionTeacherUser } = UserAndAccountTestFactory.buildTeacher();
					const substitutionTeacher = userDoFactory.build({ id: substitutionTeacherUser.id });
					const substitutionTeacherPseudonym = pseudonymFactory.build({
						userId: substitutionTeacher.id,
						toolId: externalTool.id,
					});

					const courseA = courseEntityFactory.buildWithId({
						school: schoolEntity,
						students: [studentUser, studentUser2],
						teachers: [teacherUser],
						substitutionTeachers: [substitutionTeacherUser],
						classes: [],
						groups: [],
					});

					const externalToolElement = externalToolElementFactory.build();
					const otherExternalToolElement = externalToolElementFactory.build();
					const emptyExternalToolElement = externalToolElementFactory.build({
						contextExternalToolId: undefined,
					});
					const card = cardFactory.build({
						children: [externalToolElement, otherExternalToolElement, emptyExternalToolElement],
					});
					const column = columnFactory.build({ children: [card] });
					const columnBoard = columnBoardFactory.build({
						children: [column],
						context: { id: courseA.id, type: BoardExternalReferenceType.Course },
					});

					const contextExternalTool = contextExternalToolFactory
						.withSchoolExternalToolRef(schoolExternalTool.id, schoolExternalTool.schoolId)
						.buildWithId({
							contextRef: new ContextRef({
								id: courseA.id,
								type: ToolContextType.BOARD_ELEMENT,
							}),
						});
					externalToolElement.contextExternalToolId = contextExternalTool.id;
					const otherContextExternalTool: ContextExternalTool = contextExternalToolFactory
						.withSchoolExternalToolRef(otherSchoolExternalTool.id, otherSchoolExternalTool.schoolId)
						.buildWithId({
							contextRef: new ContextRef({
								id: courseA.id,
								type: ToolContextType.BOARD_ELEMENT,
							}),
						});
					otherExternalToolElement.contextExternalToolId = otherContextExternalTool.id;

					config.featureColumnBoardExternalToolsEnabled = true;

					courseService.findById.mockResolvedValue(courseA);
					externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(externalTool);
					schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([schoolExternalTool]);
					contextExternalToolService.findContextExternalTools.mockResolvedValueOnce([]);
					columnBoardService.findByExternalReference.mockResolvedValueOnce([columnBoard]);
					contextExternalToolService.findById.mockResolvedValueOnce(contextExternalTool);
					contextExternalToolService.findById.mockResolvedValueOnce(otherContextExternalTool);

					userService.findById.mockResolvedValueOnce(student1);
					pseudonymService.findOrCreatePseudonym.mockResolvedValueOnce(student1Pseudonym);
					userService.findById.mockResolvedValueOnce(student2);
					pseudonymService.findOrCreatePseudonym.mockResolvedValueOnce(student2Pseudonym);
					userService.findById.mockResolvedValueOnce(teacher);
					pseudonymService.findOrCreatePseudonym.mockResolvedValueOnce(teacherPseudonym);
					userService.findById.mockResolvedValueOnce(substitutionTeacher);
					pseudonymService.findOrCreatePseudonym.mockResolvedValueOnce(substitutionTeacherPseudonym);

					const mockedIframeSubject = 'mockedIframeSubject';
					pseudonymService.getIframeSubject.mockReturnValue(mockedIframeSubject);

					return {
						externalTool,
						courseA,
						schoolExternalTool,
						mockedIframeSubject,
						student1,
						student2,
						teacher,
						substitutionTeacher,
						student1Pseudonym,
						student2Pseudonym,
						teacherPseudonym,
						substitutionTeacherPseudonym,
					};
				};

				it('should return a group for the course where the tool of the users pseudonym is used', async () => {
					const {
						externalTool,
						courseA,
						mockedIframeSubject,
						student1Pseudonym,
						student2Pseudonym,
						teacherPseudonym,
						substitutionTeacherPseudonym,
					} = setup();

					const result = await service.getGroup(courseA.id, externalTool.id);

					expect(result).toEqual({
						data: {
							students: [
								{
									user_id: student1Pseudonym.pseudonym,
									username: mockedIframeSubject,
								},
								{
									user_id: student2Pseudonym.pseudonym,
									username: mockedIframeSubject,
								},
							],
							teachers: [
								{
									user_id: teacherPseudonym.pseudonym,
									username: mockedIframeSubject,
								},
								{
									user_id: substitutionTeacherPseudonym.pseudonym,
									username: mockedIframeSubject,
								},
							],
						},
					});
				});
			});

			describe('when invalid oauth2Client was given and external tool was not found', () => {
				const setup = () => {
					const course = courseEntityFactory.buildWithId();

					courseService.findById.mockResolvedValue(course);
					externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValueOnce(null);

					return {
						course,
					};
				};

				it('should throw an NotFoundLoggableException', async () => {
					const { course } = setup();

					await expect(service.getGroup(course.id, 'oauth2ClientId')).rejects.toThrow(
						new NotFoundLoggableException(ExternalTool.name, { 'config.clientId': 'oauth2ClientId' })
					);
				});
			});

			describe('when the external tool is deactivated', () => {
				const setup = () => {
					const externalTool = externalToolFactory.buildWithId({ isDeactivated: true });
					const course = courseEntityFactory.buildWithId();

					courseService.findById.mockResolvedValue(course);
					externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValueOnce(externalTool);

					return {
						course,
					};
				};

				it('should throw an NotFoundLoggableException', async () => {
					const { course } = setup();

					await expect(service.getGroup(course.id, 'oauth2ClientId')).rejects.toThrow(
						new NotFoundLoggableException(ExternalTool.name, { 'config.clientId': 'oauth2ClientId' })
					);
				});
			});

			describe('when no school external tool was found which belongs to the external tool', () => {
				const setup = () => {
					const externalTool = externalToolFactory.buildWithId();
					const externalToolId = externalTool.id;
					const course = courseEntityFactory.buildWithId();

					courseService.findById.mockResolvedValue(course);
					externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValueOnce(externalTool);
					schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([]);

					return {
						externalToolId,
					};
				};

				it('should throw an NotFoundLoggableException', async () => {
					const { externalToolId } = setup();

					const func = service.getGroup('courseId', 'oauth2ClientId');

					await expect(func).rejects.toThrow(
						new NotFoundLoggableException(SchoolExternalTool.name, { toolId: externalToolId })
					);
				});
			});

			describe('when no context external tool was found which belongs to the course', () => {
				const setup = () => {
					const externalTool = externalToolFactory.buildWithId();
					const schoolExternalTool = schoolExternalToolFactory.buildWithId();
					const course = courseEntityFactory.buildWithId();

					config.featureColumnBoardExternalToolsEnabled = false;

					courseService.findById.mockResolvedValue(course);
					externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValueOnce(externalTool);
					schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([schoolExternalTool]);
					contextExternalToolService.findContextExternalTools.mockResolvedValueOnce([]);
				};

				it('should throw an NotFoundLoggableException', async () => {
					setup();

					const func = service.getGroup('courseId', 'oauth2ClientId');

					await expect(func).rejects.toThrow(
						new NotFoundLoggableException(ContextExternalTool.name, { contextId: 'courseId' })
					);
				});
			});
		});

		describe('when trying the get a room', () => {
			describe('when room does not exist, it should fallback to course instead', () => {
				const setup = () => {
					const id = new ObjectId().toHexString();
					const clientId = 'testClientId';

					roomService.roomExists.mockResolvedValueOnce(false);

					const course = courseEntityFactory.buildWithId({});
					courseService.findById.mockResolvedValueOnce(course);

					const externalTool = externalToolFactory.withOauth2Config({ clientId }).buildWithId();
					const schoolExternalTool = schoolExternalToolFactory.buildWithId({
						toolId: externalTool.id,
						schoolId: course.school.id,
					});
					const contextExternalTool = contextExternalToolFactory
						.withSchoolExternalToolRef(schoolExternalTool.id, schoolExternalTool.schoolId)
						.buildWithId({
							contextRef: new ContextRef({
								id: course.id,
								type: ToolContextType.BOARD_ELEMENT,
							}),
						});
					externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValueOnce(externalTool);
					schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([schoolExternalTool]);
					contextExternalToolService.findContextExternalTools.mockResolvedValueOnce([contextExternalTool]);

					return {
						clientId,
						id,
					};
				};

				it('should fallback to course', async () => {
					const { clientId, id } = setup();

					await service.getGroup(id, clientId);

					expect(courseService.findById).toHaveBeenCalledWith(id);
				});
			});

			describe('when the room exists, but has no owner', () => {
				const setup = () => {
					const room = roomFactory.build({});
					roomService.roomExists.mockResolvedValueOnce(true);
					roomService.getSingleRoom.mockResolvedValueOnce(room);

					roomMembershipService.getRoomAuthorizable.mockResolvedValueOnce(
						new RoomAuthorizable(room.id, [], room.schoolId)
					);

					const clientId = 'testClientId';

					return {
						room,
						clientId,
					};
				};

				it('should throw an error if the room has no owner', async () => {
					const { room, clientId } = setup();

					await expect(service.getGroup(room.id, clientId)).rejects.toThrow(
						new NotFoundLoggableException(RoomAuthorizable.name, { roomId: room.id })
					);
				});
			});

			describe('when room exists and has a column board with an active external-tool', () => {
				const setup = () => {
					const student = userDoFactory
						.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }])
						.build();
					student.id = new ObjectId().toHexString();
					const teacher = userDoFactory
						.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.TEACHER }])
						.build();
					teacher.id = new ObjectId().toHexString();

					userService.findById.mockResolvedValueOnce(student).mockResolvedValueOnce(teacher);

					const room = roomFactory.build({ schoolId: student.schoolId });
					roomService.roomExists.mockResolvedValueOnce(true);
					roomService.getSingleRoom.mockResolvedValue(room);

					const clientId = 'testClientId';

					const externalTool = externalToolFactory.withOauth2Config({ clientId }).buildWithId();
					const schoolExternalTool = schoolExternalToolFactory.buildWithId({
						toolId: externalTool.id,
						schoolId: room.schoolId,
					});
					const contextExternalTool = contextExternalToolFactory
						.withSchoolExternalToolRef(schoolExternalTool.id, schoolExternalTool.schoolId)
						.buildWithId({
							contextRef: new ContextRef({
								id: room.id,
								type: ToolContextType.BOARD_ELEMENT,
							}),
						});
					externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValueOnce(externalTool);
					schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([schoolExternalTool]);
					contextExternalToolService.findContextExternalTools.mockResolvedValueOnce([contextExternalTool]);

					const externalToolElement = externalToolElementFactory.build();
					const emptyExternalToolElement = externalToolElementFactory.build({
						contextExternalToolId: undefined,
					});

					const card = cardFactory.build({
						children: [externalToolElement, emptyExternalToolElement],
					});
					const column = columnFactory.build({ children: [card] });
					const columnBoard = columnBoardFactory.build({
						children: [column],
						context: { id: room.id, type: BoardExternalReferenceType.Room },
					});

					columnBoardService.findByExternalReference.mockResolvedValue([columnBoard]);
					contextExternalToolService.findById.mockResolvedValueOnce(contextExternalTool);

					const members: UserWithRoomRoles[] = [
						{
							roles: [
								{
									id: 'role-id',
									name: RoleName.ROOMVIEWER,
									permissions: [],
								},
							],
							userId: student.id,
							userSchoolId: student.schoolId,
						},
						{
							roles: [
								{
									id: 'role-id',
									name: RoleName.ROOMOWNER,
									permissions: [],
								},
							],
							userId: teacher.id,
							userSchoolId: teacher.schoolId,
						},
					];
					const roomAuthorizable = new RoomAuthorizable(room.id, members, student.schoolId);
					roomMembershipService.getRoomAuthorizablesByUserId.mockResolvedValueOnce([roomAuthorizable]);

					roomMembershipService.getRoomAuthorizable.mockResolvedValueOnce(roomAuthorizable);

					const pseudonymStudent = pseudonymFactory.build({ userId: student.id });
					const pseudonymTeacher = pseudonymFactory.build({ userId: teacher.id });
					pseudonymService.findOrCreatePseudonym
						.mockResolvedValueOnce(pseudonymStudent)
						.mockResolvedValueOnce(pseudonymTeacher);
					pseudonymService.getIframeSubject.mockReturnValue('mockedIframeSubject');

					config.featureColumnBoardExternalToolsEnabled = true;

					return {
						clientId,
						externalTool,
						room,
						schoolExternalTool,
						pseudonymStudent,
						pseudonymTeacher,
					};
				};

				it('should call the roomService.getSingleRoom to find the room', async () => {
					const { room, clientId } = setup();

					await service.getGroup(room.id, clientId);

					expect(roomService.getSingleRoom).toHaveBeenCalledWith(room.id);
				});

				it('should call externalToolService to find the external tool', async () => {
					const { room, clientId } = setup();

					await service.getGroup(room.id, clientId);

					expect(externalToolService.findExternalToolByOAuth2ConfigClientId).toHaveBeenCalledWith(clientId);
				});

				it('should throw if external tool is not referenced in room', async () => {
					const { room, clientId } = setup();
					const columnBoard = columnBoardFactory.build({
						children: [],
						context: { id: room.id, type: BoardExternalReferenceType.Room },
					});
					columnBoardService.findByExternalReference.mockResolvedValue([columnBoard]);

					await expect(service.getGroup(room.id, clientId)).rejects.toThrow(
						new NotFoundLoggableException(ContextExternalTool.name, { contextId: room.id })
					);
				});

				it('should return the mapped room members as group', async () => {
					const { room, clientId, pseudonymStudent, pseudonymTeacher } = setup();

					const result = await service.getGroup(room.id, clientId);

					expect(result).toEqual({
						data: {
							students: [
								{
									user_id: pseudonymStudent.pseudonym,
									username: 'mockedIframeSubject',
								},
							],
							teachers: [
								{
									user_id: pseudonymTeacher.pseudonym,
									username: 'mockedIframeSubject',
								},
							],
						},
					});
				});
			});
		});
	});
});
