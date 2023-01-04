import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { Page } from '@shared/domain/interface/page';
import { externalToolDOFactory } from '@shared/testing/factory/domainobject/external-tool.factory';
import { schoolExternalToolDOFactory } from '@shared/testing/factory/domainobject/school-external-tool.factory';
import { UnauthorizedException } from '@nestjs/common';
import { setupEntities, userFactory } from '@shared/testing';
import { Permission, User } from '@shared/domain';
import { MikroORM } from '@mikro-orm/core';
import { AuthorizationService } from '../../authorization';
import { ExternalToolService } from '../service/external-tool.service';
import { SchoolExternalToolService } from '../service/school-external-tool.service';
import { ExternalToolConfigurationUc } from './tool-configuration.uc';

describe('ExternalToolConfigurationUc', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let uc: ExternalToolConfigurationUc;

	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		orm = await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				ExternalToolConfigurationUc,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		uc = module.get(ExternalToolConfigurationUc);
		externalToolService = module.get(ExternalToolService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		authorizationService = module.get(AuthorizationService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	describe('getAvailableToolsForSchool is called', () => {
		describe('when checking for the users permission', () => {
			const setupAuthorization = () => {
				const user: User = userFactory.buildWithId();

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalToolDO>([], 0));
				schoolExternalToolService.findSchoolExternalToolsBySchoolId.mockResolvedValue([]);
				authorizationService.getUserWithPermissions.mockResolvedValue(user);

				return {
					user,
				};
			};

			it('should call the authorizationService with SCHOOL_TOOL_ADMIN permission', async () => {
				const { user } = setupAuthorization();

				await uc.getAvailableToolsForSchool('userId', 'schoolId');

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.SCHOOL_TOOL_ADMIN]);
			});

			it('should fail when authorizationService throws UnauthorizedException', async () => {
				setupAuthorization();

				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				const func = uc.getAvailableToolsForSchool('userId', 'schoolId');

				await expect(func).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when getting the list of external tools that can be added to a school', () => {
			it('should filter tools that are already in use', async () => {
				const externalToolDOs: ExternalToolDO[] = [
					externalToolDOFactory.buildWithId(undefined, 'usedToolId'),
					externalToolDOFactory.buildWithId(undefined, 'unusedToolId'),
				];

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalToolDO>(externalToolDOs, 2));
				schoolExternalToolService.findSchoolExternalToolsBySchoolId.mockResolvedValue(
					schoolExternalToolDOFactory.buildList(1, { toolId: 'usedToolId' })
				);

				const result: ExternalToolDO[] = await uc.getAvailableToolsForSchool('userId', 'schoolId');

				expect(result).toHaveLength(1);
			});

			it('should filter tools that are hidden', async () => {
				const externalToolDOs: ExternalToolDO[] = [
					externalToolDOFactory.buildWithId({ isHidden: true }),
					externalToolDOFactory.buildWithId({ isHidden: false }),
				];

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalToolDO>(externalToolDOs, 2));
				schoolExternalToolService.findSchoolExternalToolsBySchoolId.mockResolvedValue([]);

				const result: ExternalToolDO[] = await uc.getAvailableToolsForSchool('userId', 'schoolId');

				expect(result).toHaveLength(1);
			});

			it('should return a list of available external tools', async () => {
				const externalToolDOs: ExternalToolDO[] = externalToolDOFactory.buildListWithId(2);

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalToolDO>(externalToolDOs, 2));
				schoolExternalToolService.findSchoolExternalToolsBySchoolId.mockResolvedValue([]);

				const result: ExternalToolDO[] = await uc.getAvailableToolsForSchool('userId', 'schoolId');

				expect(result).toEqual(externalToolDOs);
			});
		});
	});
});
