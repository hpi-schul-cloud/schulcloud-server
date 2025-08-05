import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DatabaseObjectNotFoundException } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardExternalReferenceType, ColumnBoardService } from '@modules/board';
import { cardFactory, columnBoardFactory, columnFactory, externalToolElementFactory } from '@modules/board/testing';
import { CourseService } from '@modules/course';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { legacySchoolDoFactory } from '@modules/legacy-school/testing';
import { PseudonymService } from '@modules/pseudonym';
import { pseudonymFactory } from '@modules/pseudonym/testing';
import { RoleName } from '@modules/role';
import { schoolEntityFactory } from '@modules/school/testing';
import { ToolContextType } from '@modules/tool/common/enum';
import { ContextExternalTool, ContextRef } from '@modules/tool/context-external-tool/domain';
import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import { contextExternalToolFactory } from '@modules/tool/context-external-tool/testing';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { ExternalToolService } from '@modules/tool/external-tool/service';
import { externalToolFactory } from '@modules/tool/external-tool/testing';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { SchoolExternalToolService } from '@modules/tool/school-external-tool/service';
import { schoolExternalToolFactory } from '@modules/tool/school-external-tool/testing';
import { UserDo, UserService } from '@modules/user';
import { userDoFactory } from '@modules/user/testing';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { setupEntities } from '@testing/database';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { RosterConfig } from '../roster.config';
import { FeathersRosterService } from './feathers-roster.service';
import { RoomService } from '@modules/room';
import { RoomMembershipService } from '@modules/room-membership';

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
	let roomService: DeepMocked<RoomService>;
	let roomMembershipService: DeepMocked<RoomMembershipService>;
	let configService: DeepMocked<ConfigService<RosterConfig, true>>;

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
					provide: RoomService,
					useValue: createMock<RoomService>(),
				},
				{
					provide: RoomMembershipService,
					useValue: createMock<RoomMembershipService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
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
		roomService = module.get(RoomService);
		roomMembershipService = module.get(RoomMembershipService);
		configService = module.get(ConfigService);

		await setupEntities([CourseEntity, CourseGroupEntity]);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getUsersMetadata', () => {
		describe('when pseudonym is given', () => {
			const setup = () => {
				const pseudonym = pseudonymFactory.build();
				const user = userDoFactory.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }]).build();
				const iFrameSubject = 'iFrameSubject';

				pseudonymService.findPseudonymByPseudonym.mockResolvedValue(pseudonym);
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

				expect(pseudonymService.findPseudonymByPseudonym).toHaveBeenCalledWith(pseudonym.pseudonym);
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

				pseudonymService.findPseudonymByPseudonym.mockResolvedValue(null);

				return {
					pseudonym,
				};
			};

			it('should throw an NotFoundLoggableException', async () => {
				const { pseudonym } = setup();

				const func = service.getUsersMetadata(pseudonym.pseudonym);

				await expect(func).rejects.toThrow(
					new NotFoundLoggableException(UserDo.name, { pseudonym: pseudonym.pseudonym })
				);
			});
		});

		describe('when user does not exists', () => {
			const setup = () => {
				const pseudonym = pseudonymFactory.build();
				const user = userDoFactory.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }]).build();

				pseudonymService.findPseudonymByPseudonym.mockResolvedValue(pseudonym);
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
	});

	describe('getUserGroups', () => {
		describe('when the tool is active in a course', () => {
			const setup = () => {
				const user = userDoFactory.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }]).build();
				const school = legacySchoolDoFactory.buildWithId({ id: user.schoolId });
				const pseudonym = pseudonymFactory.build({ userId: user.id });

				const courseA = courseEntityFactory.buildWithId();
				const courseB = courseEntityFactory.buildWithId();
				const courseC = courseEntityFactory.buildWithId();
				const courses = [courseA, courseB, courseC];

				const clientId = 'testClientId';
				const externalTool = externalToolFactory.withOauth2Config({ clientId }).buildWithId();
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

				pseudonymService.findPseudonymByPseudonym.mockResolvedValue(pseudonym);
				userService.findById.mockResolvedValueOnce(user);
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([schoolExternalTool]);
				courseService.findAllByUserId.mockResolvedValue(courses);
				// Course A
				contextExternalToolService.findContextExternalTools.mockResolvedValueOnce([contextExternalTool]);
				configService.get.mockReturnValueOnce(true);
				columnBoardService.findByExternalReference.mockResolvedValueOnce([]);
				// Course B
				contextExternalToolService.findContextExternalTools.mockResolvedValueOnce([]);
				configService.get.mockReturnValueOnce(true);
				columnBoardService.findByExternalReference.mockResolvedValueOnce([]);
				// Course C
				contextExternalToolService.findContextExternalTools.mockResolvedValueOnce([]);
				configService.get.mockReturnValueOnce(false);

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
			const setup = () => {
				const user = userDoFactory.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }]).build();
				const school = legacySchoolDoFactory.buildWithId({ id: user.schoolId });
				const pseudonym = pseudonymFactory.build({ userId: user.id });

				const courseA = courseEntityFactory.buildWithId();
				const courseB = courseEntityFactory.buildWithId();
				const courseC = courseEntityFactory.buildWithId();
				const courses = [courseA, courseB, courseC];

				const clientId = 'testClientId';
				const externalTool = externalToolFactory.withOauth2Config({ clientId }).buildWithId();
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

				pseudonymService.findPseudonymByPseudonym.mockResolvedValue(pseudonym);
				userService.findById.mockResolvedValueOnce(user);
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([schoolExternalTool]);
				courseService.findAllByUserId.mockResolvedValue(courses);
				// Course A
				contextExternalToolService.findContextExternalTools.mockResolvedValueOnce([]);
				configService.get.mockReturnValueOnce(true);
				columnBoardService.findByExternalReference.mockResolvedValueOnce([columnBoard]);
				contextExternalToolService.findById.mockResolvedValueOnce(contextExternalTool);
				contextExternalToolService.findById.mockResolvedValueOnce(otherContextExternalTool);
				// Course B
				contextExternalToolService.findContextExternalTools.mockResolvedValueOnce([]);
				configService.get.mockReturnValueOnce(true);
				columnBoardService.findByExternalReference.mockResolvedValueOnce([]);
				// Course C
				contextExternalToolService.findContextExternalTools.mockResolvedValueOnce([]);
				configService.get.mockReturnValueOnce(false);

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
		});

		describe('when pseudonym does not exists', () => {
			const setup = () => {
				const pseudonym = pseudonymFactory.build();

				pseudonymService.findPseudonymByPseudonym.mockResolvedValue(null);

				return {
					pseudonym,
				};
			};

			it('should throw an NotFoundLoggableException', async () => {
				const { pseudonym } = setup();

				const func = service.getUserGroups(pseudonym.pseudonym, 'externalToolId');

				await expect(func).rejects.toThrow(
					new NotFoundLoggableException(UserDo.name, { pseudonym: pseudonym.pseudonym })
				);
			});
		});

		describe('when the external tool does not exist', () => {
			const setup = () => {
				const user = userDoFactory.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }]).build();
				const pseudonym = pseudonymFactory.build({ userId: user.id });

				pseudonymService.findPseudonymByPseudonym.mockResolvedValue(pseudonym);
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

				pseudonymService.findPseudonymByPseudonym.mockResolvedValue(pseudonym);
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
				const pseudonym = pseudonymFactory.build({ userId: user.id });

				const clientId = 'testClientId';
				const externalTool = externalToolFactory.withOauth2Config({ clientId }).buildWithId();

				pseudonymService.findPseudonymByPseudonym.mockResolvedValue(pseudonym);
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
	});

	describe('getGroup', () => {
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

				courseService.findById.mockResolvedValue(courseA);
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([schoolExternalTool]);
				contextExternalToolService.findContextExternalTools.mockResolvedValueOnce([contextExternalTool]);
				configService.get.mockReturnValueOnce(false);

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

				courseService.findById.mockResolvedValue(courseA);
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([schoolExternalTool]);
				contextExternalToolService.findContextExternalTools.mockResolvedValueOnce([]);
				configService.get.mockReturnValueOnce(true);
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

				courseService.findById.mockResolvedValue(course);
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValueOnce(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([schoolExternalTool]);
				contextExternalToolService.findContextExternalTools.mockResolvedValueOnce([]);
			};

			it('should throw an NotFoundLoggableException', async () => {
				setup();

				const func = service.getGroup('courseId', 'oauth2ClientId');

				await expect(func).rejects.toThrow(
					new NotFoundLoggableException(ContextExternalTool.name, { 'contextRef.id': 'courseId' })
				);
			});
		});
	});
});
