import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DatabaseObjectNotFoundException } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { Course, Pseudonym, RoleName, SchoolDO, UserDO } from '@shared/domain';
import {
	contextExternalToolFactory,
	courseFactory,
	externalToolFactory,
	pseudonymFactory,
	schoolDOFactory,
	schoolExternalToolFactory,
	setupEntities,
	userDoFactory,
} from '@shared/testing';
import { CourseService } from '@src/modules/learnroom/service/course.service';
import { ToolContextType } from '@src/modules/tool/common/enum';
import { ContextExternalTool, ContextRef } from '@src/modules/tool/context-external-tool/domain';
import { ContextExternalToolService } from '@src/modules/tool/context-external-tool/service';
import { ExternalToolService } from '@src/modules/tool/external-tool/service';
import { SchoolExternalToolService } from '@src/modules/tool/school-external-tool/service';
import { UserService } from '@src/modules/user';
import { ObjectId } from 'bson';
import { ExternalTool } from '../../tool/external-tool/domain';
import { SchoolExternalTool } from '../../tool/school-external-tool/domain';
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
					new NotFoundLoggableException(UserDO.name, 'pseudonym', pseudonym.pseudonym)
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
				const school: SchoolDO = schoolDOFactory.buildWithId();
				const externalTool: ExternalTool = externalToolFactory.buildWithId();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
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

				const contextExternalToolA: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string, schoolExternalTool.schoolId)
					.buildWithId({
						contextRef: new ContextRef({
							id: courseA.id,
							type: ToolContextType.COURSE,
						}),
					});

				const contextExternalToolB: ContextExternalTool = contextExternalToolFactory.buildWithId({
					contextRef: new ContextRef({
						id: courseB.id,
						type: ToolContextType.COURSE,
					}),
				});

				const contextExternalToolB2: ContextExternalTool = contextExternalToolFactory.buildWithId({
					contextRef: new ContextRef({
						id: courseB.id,
						type: ToolContextType.COURSE,
					}),
				});

				pseudonymService.findPseudonymByPseudonym.mockResolvedValue(pseudonym);
				courseService.findAllByUserId.mockResolvedValue(courses);
				contextExternalToolService.findAllByContext.mockResolvedValueOnce([contextExternalToolA]);
				contextExternalToolService.findAllByContext.mockResolvedValueOnce([
					contextExternalToolB,
					contextExternalToolB2,
				]);
				contextExternalToolService.findAllByContext.mockResolvedValueOnce([]);

				return {
					pseudonym,
					user,
					courses,
				};
			};

			it('should call the pseudonym service to find the pseudonym', async () => {
				const { pseudonym } = setup();

				await service.getUserGroups(pseudonym.pseudonym);

				expect(pseudonymService.findPseudonymByPseudonym).toHaveBeenCalledWith(pseudonym.pseudonym);
			});

			it('should call the course service to find the courses for the userId of the pseudonym', async () => {
				const { pseudonym } = setup();

				await service.getUserGroups(pseudonym.pseudonym);

				expect(courseService.findAllByUserId).toHaveBeenCalledWith(pseudonym.userId);
			});

			it('should call the context external tool service to find the external tools for each course', async () => {
				const { pseudonym, courses } = setup();

				await service.getUserGroups(pseudonym.pseudonym);

				expect(contextExternalToolService.findAllByContext).toHaveBeenNthCalledWith(
					courses.length,
					new ContextRef({ id: courses[0].id, type: ToolContextType.COURSE }),
					new ContextRef({ id: courses[1].id, type: ToolContextType.COURSE }),
					new ContextRef({ id: courses[2].id, type: ToolContextType.COURSE })
				);
			});

			it('should return a group for each course where the tool of the users pseudonym is used', async () => {
				const { pseudonym, courses } = setup();

				const result = await service.getUserGroups(pseudonym.pseudonym);

				expect(result).toEqual({
					data: [
						{
							id: courses[0].id,
							name: courses[0].name,
							students: [
								{
									user_id: pseudonym.userId,
									username: pseudonym.pseudonym,
									type: 'student',
								},
							],
							teachers: [],
						},
						{
							id: courses[1].id,
							name: courses[1].name,
							students: [
								{
									user_id: pseudonym.userId,
									username: pseudonym.pseudonym,
									type: 'student',
								},
							],
							teachers: [],
						},
					],
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

				const func = service.getUserGroups(pseudonym.pseudonym);

				await expect(func).rejects.toThrow(
					new NotFoundLoggableException(UserDO.name, 'pseudonym', pseudonym.pseudonym)
				);
			});
		});
	});

	describe('getGroup', () => {});
});
