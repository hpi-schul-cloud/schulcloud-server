import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { SchoolService } from '@modules/school';
import { schoolFactory } from '@modules/school/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { SchoolExternalToolService } from '../../school-external-tool';
import { schoolExternalToolFactory } from '../../school-external-tool/testing';
import { ExternalToolUtilizationService } from '../service';
import { SchoolExternalToolUtilizationUc } from './school-external-tool-utilization.uc';

describe(SchoolExternalToolUtilizationUc.name, () => {
	let module: TestingModule;
	let uc: SchoolExternalToolUtilizationUc;

	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let externalToolUtilizationService: DeepMocked<ExternalToolUtilizationService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolService: DeepMocked<SchoolService>;

	beforeAll(async () => {
		await setupEntities([User]);
		module = await Test.createTestingModule({
			providers: [
				SchoolExternalToolUtilizationUc,
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
				{
					provide: ExternalToolUtilizationService,
					useValue: createMock<ExternalToolUtilizationService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
			],
		}).compile();

		uc = module.get(SchoolExternalToolUtilizationUc);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		externalToolUtilizationService = module.get(ExternalToolUtilizationService);
		authorizationService = module.get(AuthorizationService);
		schoolService = module.get(SchoolService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getUtilizationForSchoolExternalTool', () => {
		describe('when authorize user', () => {
			const setupMetadata = () => {
				const toolId = new ObjectId().toHexString();
				const tool = schoolExternalToolFactory.buildWithId({ id: toolId }, toolId);
				const userId = new ObjectId().toHexString();
				const user = userFactory.buildWithId({}, userId);
				const school = schoolFactory.build({ id: tool.schoolId });

				schoolExternalToolService.findById.mockResolvedValue(tool);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);

				return {
					user,
					toolId: tool.id,
					school,
				};
			};

			it('should check the permissions of the user', async () => {
				const { user, toolId, school } = setupMetadata();

				await uc.getUtilizationForSchoolExternalTool(user.id, toolId);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					school,
					AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN])
				);
			});
		});

		describe('when externalToolId is given', () => {
			const setupMetadata = () => {
				const user = userFactory.buildWithId();
				const toolId = new ObjectId().toHexString();
				const school = schoolFactory.build({ id: new ObjectId().toHexString() });
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					id: toolId,
				});

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);

				return {
					toolId,
					user,
				};
			};

			it('should call the service to get metadata', async () => {
				const { toolId, user } = setupMetadata();

				await uc.getUtilizationForSchoolExternalTool(user.id, toolId);

				expect(externalToolUtilizationService.getUtilizationForSchoolExternalTool).toHaveBeenCalledWith(toolId);
			});
		});
	});
});
