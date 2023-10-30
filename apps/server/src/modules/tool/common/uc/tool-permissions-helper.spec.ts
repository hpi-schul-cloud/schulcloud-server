import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacySchoolDo } from '@shared/domain/domainobject/legacy-school.do';
import { Permission } from '@shared/domain/interface/permission.enum';
import { legacySchoolDoFactory } from '@shared/testing/factory/domainobject/legacy-school.factory';
import { contextExternalToolFactory } from '@shared/testing/factory/domainobject/tool/context-external-tool.factory';
import { schoolExternalToolFactory } from '@shared/testing/factory/domainobject/tool/school-external-tool.factory';
import { setupEntities } from '@shared/testing/setup-entities';
import { AuthorizationContextBuilder } from '@src/modules/authorization/authorization-context.builder';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { AuthorizationContext } from '@src/modules/authorization/types/authorization-context.interface';
import { LegacySchoolService } from '@src/modules/legacy-school/service/legacy-school.service';
import { ContextExternalTool } from '../../context-external-tool/domain/context-external-tool.do';
import { SchoolExternalTool } from '../../school-external-tool/domain/school-external-tool.do';
import { ToolPermissionHelper } from './tool-permission-helper';

describe('ToolPermissionHelper', () => {
	let module: TestingModule;
	let helper: ToolPermissionHelper;

	let authorizationService: DeepMocked<AuthorizationService>;
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
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
			],
		}).compile();

		helper = module.get(ToolPermissionHelper);
		authorizationService = module.get(AuthorizationService);
		schoolService = module.get(LegacySchoolService);
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

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
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
				const school: LegacySchoolDo = legacySchoolDoFactory.build({ id: schoolExternalTool.schoolId });

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
