import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { contextExternalToolFactory, schoolDOFactory, schoolExternalToolFactory, setupEntities } from '@shared/testing';
import { Permission, SchoolDO } from '@shared/domain';
import { AuthorizationContext, AuthorizationContextBuilder, AuthorizationService } from '@src/modules/authorization';
import { AuthorizationReferenceService } from '@src/modules/authorization/domain';
import { SchoolService } from '@src/modules/school';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ToolPermissionHelper } from './tool-permission-helper';
import { SchoolExternalTool } from '../../school-external-tool/domain';

describe('ToolPermissionHelper', () => {
	let module: TestingModule;
	let helper: ToolPermissionHelper;

	let authorizationService: DeepMocked<AuthorizationService>;
	let authorizationReferenceService: DeepMocked<AuthorizationReferenceService>;
	let schoolService: DeepMocked<SchoolService>;

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
					provide: AuthorizationReferenceService,
					useValue: createMock<AuthorizationReferenceService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
			],
		}).compile();

		helper = module.get(ToolPermissionHelper);
		authorizationService = module.get(AuthorizationService);
		authorizationReferenceService = module.get(AuthorizationReferenceService);
		schoolService = module.get(SchoolService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('ensureContextPermissions', () => {
		describe('when context external tool is given', () => {
			const setup = () => {
				const userId = 'userId';
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();
				const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER]);

				return {
					userId,
					contextExternalTool,
					context,
				};
			};

			it('should check permission for context external tool', async () => {
				const { userId, contextExternalTool, context } = setup();

				await helper.ensureContextPermissions(userId, contextExternalTool, context);

				expect(authorizationReferenceService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId,
					'courses',
					contextExternalTool.contextRef.id,
					context
				);
			});
		});
	});

	describe('ensureSchoolPermissions', () => {
		describe('when school external tool is given', () => {
			const setup = () => {
				const userId = 'userId';
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);
				const school: SchoolDO = schoolDOFactory.build({ id: schoolExternalTool.schoolId });

				schoolService.getSchoolById.mockResolvedValue(school);

				return {
					userId,
					schoolExternalTool,
					school,
					context,
				};
			};

			it('should check permission for school external tool', async () => {
				const { userId, schoolExternalTool, context, school } = setup();

				await helper.ensureSchoolPermissions(userId, schoolExternalTool, context);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(userId, school, context);
			});
		});
	});
});
