import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DatabaseObjectNotFoundException } from '@mikro-orm/core';

import { CourseService } from '@modules/learnroom/service/course.service';
import { ToolContextType } from '@modules/tool/common/enum';
import { ContextExternalTool, ContextRef } from '@modules/tool/context-external-tool/domain';
import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { ExternalToolService } from '@modules/tool/external-tool/service';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { SchoolExternalToolService } from '@modules/tool/school-external-tool/service';
import { UserService } from '@modules/user';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { LegacySchoolDo, Pseudonym, UserDO } from '@shared/domain/domainobject';
import { Course, SchoolEntity } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';
import {
	contextExternalToolFactory,
	courseFactory,
	externalToolFactory,
	legacySchoolDoFactory,
	pseudonymFactory,
	schoolEntityFactory,
	schoolExternalToolFactory,
	setupEntities,
	UserAndAccountTestFactory,
	userDoFactory,
} from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { FeathersRosterService } from './feathers-roster.service';
import { PseudonymService } from './pseudonym.service';

describe('FeathersRosterService', () => {
	let module: TestingModule;
	let service: FeathersRosterService;

	let userService: DeepMocked<UserService>;
	let pseudonymService: DeepMocked<PseudonymService>;
	let courseService: DeepMocked<CourseService>;
	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;

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
			],
		}).compile();

		service = module.get(FeathersRosterService);
		pseudonymService = module.get(PseudonymService);
		userService = module.get(UserService);
		courseService = module.get(CourseService);
		externalToolService = module.get(ExternalToolService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		contextExternalToolService = module.get(ContextExternalToolService);

		await setupEntities();
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
				const pseudonym: Pseudonym = pseudonymFactory.build();
				const user: UserDO = userDoFactory
					.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }])
					.build();
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
				const pseudonym: Pseudonym = pseudonymFactory.build();

				pseudonymService.findPseudonymByPseudonym.mockResolvedValue(null);

				return {
					pseudonym,
				};
			};

			it('should throw an NotFoundLoggableException', async () => {
				const { pseudonym } = setup();

				const func = service.getUsersMetadata(pseudonym.pseudonym);

				await expect(func).rejects.toThrow(
					new NotFoundLoggableException(UserDO.name, { pseudonym: pseudonym.pseudonym })
				);
			});
		});

		describe('when user does not exists', () => {
			const setup = () => {
				const pseudonym: Pseudonym = pseudonymFactory.build();
				const user: UserDO = userDoFactory
					.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }])
					.build();

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
		describe('when pseudonym is given', () => {
			const setup = () => {
				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId();
				const clientId = 'testClientId';
				const externalTool: ExternalTool = externalToolFactory.withOauth2Config({ clientId }).buildWithId();
				const externalToolId: string = externalTool.id as string;

				const otherExternalTool: ExternalTool = externalToolFactory.buildWithId();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
					schoolId: school.id,
				});
				const otherSchoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: otherExternalTool.id,
					schoolId: school.id,
				});
				const pseudonym: Pseudonym = pseudonymFactory.build();
				const user: UserDO = userDoFactory
					.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }])
					.build();
				const courseA: Course = courseFactory.buildWithId();
				const courseB: Course = courseFactory.buildWithId();
				const courseC: Course = courseFactory.buildWithId();
				const courses: Course[] = [courseA, courseB, courseC];

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string, schoolExternalTool.schoolId)
					.buildWithId({
						contextRef: new ContextRef({
							id: courseA.id,
							type: ToolContextType.COURSE,
						}),
					});

				const otherContextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(otherSchoolExternalTool.id as string, otherSchoolExternalTool.schoolId)
					.buildWithId({
						contextRef: new ContextRef({
							id: courseA.id,
							type: ToolContextType.COURSE,
						}),
					});

				pseudonymService.findPseudonymByPseudonym.mockResolvedValue(pseudonym);
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(externalTool);
				courseService.findAllByUserId.mockResolvedValue(courses);
				contextExternalToolService.findAllByContext.mockResolvedValueOnce([
					contextExternalTool,
					otherContextExternalTool,
				]);
				contextExternalToolService.findAllByContext.mockResolvedValueOnce([otherContextExternalTool]);
				contextExternalToolService.findAllByContext.mockResolvedValueOnce([]);
				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				schoolExternalToolService.findById.mockResolvedValueOnce(otherSchoolExternalTool);
				externalToolService.findById.mockResolvedValueOnce(externalTool);
				externalToolService.findById.mockResolvedValueOnce(otherExternalTool);

				return {
					pseudonym,
					externalToolId,
					clientId,
					user,
					courses,
					schoolExternalTool,
					otherSchoolExternalTool,
					otherExternalTool,
				};
			};

			it('should call the pseudonym service to find the pseudonym', async () => {
				const { pseudonym, clientId } = setup();

				await service.getUserGroups(pseudonym.pseudonym, clientId);

				expect(pseudonymService.findPseudonymByPseudonym).toHaveBeenCalledWith(pseudonym.pseudonym);
			});

			it('should call the course service to find the courses for the userId of the pseudonym', async () => {
				const { pseudonym, clientId } = setup();

				await service.getUserGroups(pseudonym.pseudonym, clientId);

				expect(courseService.findAllByUserId).toHaveBeenCalledWith(pseudonym.userId);
			});

			it('should call the context external tool service to find the external tools for each course', async () => {
				const { pseudonym, courses, clientId } = setup();

				await service.getUserGroups(pseudonym.pseudonym, clientId);

				expect(contextExternalToolService.findAllByContext.mock.calls).toEqual([
					[new ContextRef({ id: courses[0].id, type: ToolContextType.COURSE })],
					[new ContextRef({ id: courses[1].id, type: ToolContextType.COURSE })],
					[new ContextRef({ id: courses[2].id, type: ToolContextType.COURSE })],
				]);
			});

			it('should call school external tool service to find the school external tool for each context external tool', async () => {
				const { pseudonym, clientId, schoolExternalTool, otherSchoolExternalTool } = setup();

				await service.getUserGroups(pseudonym.pseudonym, clientId);

				expect(schoolExternalToolService.findById.mock.calls).toEqual([
					[schoolExternalTool.id],
					[otherSchoolExternalTool.id],
				]);
			});

			it('should call external tool service to find the external tool for each school external tool', async () => {
				const { pseudonym, clientId, otherExternalTool, externalToolId } = setup();

				await service.getUserGroups(pseudonym.pseudonym, clientId);

				expect(externalToolService.findById.mock.calls).toEqual([[externalToolId], [otherExternalTool.id]]);
			});

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

		describe('when pseudonym does not exists', () => {
			const setup = () => {
				const pseudonym: Pseudonym = pseudonymFactory.build();

				pseudonymService.findPseudonymByPseudonym.mockResolvedValue(null);

				return {
					pseudonym,
				};
			};

			it('should throw an NotFoundLoggableException', async () => {
				const { pseudonym } = setup();

				const func = service.getUserGroups(pseudonym.pseudonym, 'externalToolId');

				await expect(func).rejects.toThrow(
					new NotFoundLoggableException(UserDO.name, { pseudonym: pseudonym.pseudonym })
				);
			});
		});
	});

	describe('getGroup', () => {
		describe('when valid courseId and oauth2ClientId is given', () => {
			const setup = () => {
				let courseA: Course = courseFactory.buildWithId();
				const schoolEntity: SchoolEntity = schoolEntityFactory.buildWithId();
				const school: LegacySchoolDo = legacySchoolDoFactory.build({ id: schoolEntity.id });
				const externalTool: ExternalTool = externalToolFactory.buildWithId();
				const externalToolId: string = externalTool.id as string;
				const otherExternalTool: ExternalTool = externalToolFactory.buildWithId();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
					schoolId: school.id,
				});
				const otherSchoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: otherExternalTool.id,
					schoolId: school.id,
				});
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string, schoolExternalTool.schoolId)
					.buildWithId({
						contextRef: new ContextRef({
							id: courseA.id,
							type: ToolContextType.COURSE,
						}),
					});

				const otherContextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(otherSchoolExternalTool.id as string, otherSchoolExternalTool.schoolId)
					.buildWithId({
						contextRef: new ContextRef({
							id: courseA.id,
							type: ToolContextType.COURSE,
						}),
					});

				const { studentUser } = UserAndAccountTestFactory.buildStudent();
				const student1: UserDO = userDoFactory.build({ id: studentUser.id });
				const student1Pseudonym: Pseudonym = pseudonymFactory.build({
					userId: student1.id,
					toolId: contextExternalTool.id,
				});

				const { studentUser: studentUser2 } = UserAndAccountTestFactory.buildStudent();
				const student2: UserDO = userDoFactory.build({ id: studentUser2.id });
				const student2Pseudonym: Pseudonym = pseudonymFactory.build({
					userId: student2.id,
					toolId: contextExternalTool.id,
				});

				const { teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const teacher: UserDO = userDoFactory.build({ id: teacherUser.id });
				const teacherPseudonym: Pseudonym = pseudonymFactory.build({
					userId: teacher.id,
					toolId: contextExternalTool.id,
				});

				const { teacherUser: substitutionTeacherUser } = UserAndAccountTestFactory.buildTeacher();
				const substitutionTeacher: UserDO = userDoFactory.build({ id: substitutionTeacherUser.id });
				const substitutionTeacherPseudonym: Pseudonym = pseudonymFactory.build({
					userId: substitutionTeacher.id,
					toolId: contextExternalTool.id,
				});

				courseA = courseFactory.build({
					...courseA,
					school: schoolEntity,
					students: [studentUser, studentUser2],
					teachers: [teacherUser],
					substitutionTeachers: [substitutionTeacherUser],
					classes: [],
					groups: [],
				});

				courseService.findById.mockResolvedValue(courseA);
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([schoolExternalTool]);
				contextExternalToolService.findAllByContext.mockResolvedValueOnce([
					contextExternalTool,
					otherContextExternalTool,
				]);

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
					externalToolId,
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
				const { externalToolId, courseA } = setup();

				await service.getGroup(courseA.id, externalToolId);

				expect(courseService.findById).toHaveBeenCalledWith(courseA.id);
			});

			it('should call the external tool service to find the external tool', async () => {
				const { externalToolId } = setup();

				await service.getGroup('courseId', externalToolId);

				expect(externalToolService.findExternalToolByOAuth2ConfigClientId).toHaveBeenCalledWith(externalToolId);
			});

			it('should call the school external tool service to find the school external tool', async () => {
				const { externalToolId, schoolExternalTool } = setup();

				await service.getGroup('courseId', externalToolId);

				expect(schoolExternalToolService.findSchoolExternalTools).toHaveBeenCalledWith({
					schoolId: schoolExternalTool.schoolId,
					toolId: schoolExternalTool.toolId,
				});
			});

			it('should call the context external tool service to find the context external tool', async () => {
				const { externalToolId, courseA } = setup();

				await service.getGroup(courseA.id, externalToolId);

				expect(contextExternalToolService.findAllByContext).toHaveBeenCalledWith(
					new ContextRef({ id: courseA.id, type: ToolContextType.COURSE })
				);
			});

			it('should call the user service to find the students', async () => {
				const { externalToolId, courseA } = setup();

				await service.getGroup(courseA.id, externalToolId);

				expect(userService.findById.mock.calls).toEqual([
					[courseA.students[0].id],
					[courseA.students[1].id],
					[courseA.teachers[0].id],
					[courseA.substitutionTeachers[0].id],
				]);
			});

			it('should call the pseudonym service to find the pseudonyms', async () => {
				const { externalToolId, externalTool, courseA, student1, student2, teacher, substitutionTeacher } = setup();

				await service.getGroup(courseA.id, externalToolId);

				expect(pseudonymService.findOrCreatePseudonym.mock.calls).toEqual([
					[student1, externalTool],
					[student2, externalTool],
					[teacher, externalTool],
					[substitutionTeacher, externalTool],
				]);
			});

			it('should return a group for the course where the tool of the users pseudonym is used', async () => {
				const {
					externalToolId,
					courseA,
					mockedIframeSubject,
					student1Pseudonym,
					student2Pseudonym,
					teacherPseudonym,
					substitutionTeacherPseudonym,
				} = setup();

				const result = await service.getGroup(courseA.id, externalToolId);

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
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValueOnce(null);
			};

			it('should throw an NotFoundLoggableException', async () => {
				setup();

				const func = service.getGroup('courseId', 'oauth2ClientId');

				await expect(func).rejects.toThrow(
					new NotFoundLoggableException(ExternalTool.name, { 'config.clientId': 'oauth2ClientId' })
				);
			});
		});

		describe('when no school external tool was found which belongs to the external tool', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId();
				const externalToolId: string = externalTool.id as string;
				const course: Course = courseFactory.buildWithId();

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
				const externalTool: ExternalTool = externalToolFactory.buildWithId();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const course: Course = courseFactory.buildWithId();

				courseService.findById.mockResolvedValue(course);
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValueOnce(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([schoolExternalTool]);
				contextExternalToolService.findAllByContext.mockResolvedValueOnce([]);
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
