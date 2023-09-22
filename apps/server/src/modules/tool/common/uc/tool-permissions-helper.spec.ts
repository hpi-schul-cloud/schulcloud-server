import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import {
	contextExternalToolFactory,
	courseFactory,
	legacySchoolDoFactory,
	schoolExternalToolFactory,
	setupEntities,
	userFactory,
} from '@shared/testing';
import { Permission, LegacySchoolDo } from '@shared/domain';
import { AuthorizationContext, AuthorizationContextBuilder, AuthorizationService } from '@src/modules/authorization';
import { LegacySchoolService } from '@src/modules/legacy-school';
import { CourseRepo } from '@shared/repo';
import { ForbiddenException } from '@nestjs/common';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ToolPermissionHelper } from './tool-permission-helper';
import { SchoolExternalTool } from '../../school-external-tool/domain';

describe('ToolPermissionHelper', () => {
	let module: TestingModule;
	let helper: ToolPermissionHelper;

	let authorizationService: DeepMocked<AuthorizationService>;
	let courseRepo: DeepMocked<CourseRepo>;
	let schoolService: DeepMocked<LegacySchoolService>;

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				ToolPermissionHelper,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
			],
		}).compile();

		helper = module.get(ToolPermissionHelper);
		authorizationService = module.get(AuthorizationService);
		courseRepo = module.get(CourseRepo);
		schoolService = module.get(LegacySchoolService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('ensureContextPermissions', () => {
		describe('when context external tool with id is given', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId();
				const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER]);

				courseRepo.findById.mockResolvedValueOnce(course);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.checkPermission.mockReturnValueOnce().mockReturnValueOnce();

				return {
					user,
					course,
					contextExternalTool,
					context,
				};
			};

			it('should check permission for context external tool', async () => {
				const { user, course, contextExternalTool, context } = setup();

				await helper.ensureContextPermissions(user.id, contextExternalTool, context);

				expect(authorizationService.checkPermission).toHaveBeenCalledTimes(2);
				expect(authorizationService.checkPermission).toHaveBeenNthCalledWith(1, user, contextExternalTool, context);
				expect(authorizationService.checkPermission).toHaveBeenNthCalledWith(2, user, course, context);
			});

			it('should return undefined', async () => {
				const { user, contextExternalTool, context } = setup();

				const result = await helper.ensureContextPermissions(user.id, contextExternalTool, context);

				expect(result).toBeUndefined();
			});
		});

		describe('when context external tool without id is given', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();
				const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER]);

				courseRepo.findById.mockResolvedValueOnce(course);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					user,
					course,
					contextExternalTool,
					context,
				};
			};

			it('should check permission for context external tool', async () => {
				const { user, course, contextExternalTool, context } = setup();

				await helper.ensureContextPermissions(user.id, contextExternalTool, context);

				expect(authorizationService.checkPermission).toHaveBeenCalledTimes(1);
				expect(authorizationService.checkPermission).toHaveBeenCalledWith(user, course, context);
			});
		});

		describe('when user is unauthorized', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId();
				const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER]);

				courseRepo.findById.mockResolvedValueOnce(course);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.checkPermission.mockImplementationOnce(() => {
					throw new ForbiddenException();
				});

				return {
					user,
					course,
					contextExternalTool,
					context,
				};
			};

			it('should check permission for context external tool', async () => {
				const { user, contextExternalTool, context } = setup();

				await expect(helper.ensureContextPermissions(user.id, contextExternalTool, context)).rejects.toThrowError(
					new ForbiddenException()
				);
			});
		});
	});

	describe('ensureSchoolPermissions', () => {
		describe('when school external tool is given', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);
				const school: LegacySchoolDo = legacySchoolDoFactory.build({ id: schoolExternalTool.schoolId });

				schoolService.getSchoolById.mockResolvedValue(school);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					user,
					schoolExternalTool,
					school,
					context,
				};
			};

			it('should check permission for school external tool', async () => {
				const { user, schoolExternalTool, context, school } = setup();

				await helper.ensureSchoolPermissions(user.id, schoolExternalTool, context);

				expect(authorizationService.checkPermission).toHaveBeenCalledTimes(1);
				expect(authorizationService.checkPermission).toHaveBeenCalledWith(user, school, context);
			});

			it('should return undefined', async () => {
				const { user, schoolExternalTool, context } = setup();

				const result = await helper.ensureSchoolPermissions(user.id, schoolExternalTool, context);

				expect(result).toBeUndefined();
			});
		});
	});
});
