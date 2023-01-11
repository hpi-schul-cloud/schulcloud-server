import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ICurrentUser } from '@shared/domain';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { externalToolDOFactory } from '@shared/testing/factory/domainobject/external-tool.factory';
import { ConfigurationScope } from '../interface';
import { ExternalToolConfigurationUc } from '../uc/tool-configuration.uc';
import { IdParams, ScopeParams, ToolConfigurationEntryResponse, ToolConfigurationListResponse } from './dto';
import { ExternalToolResponseMapper } from './mapper';
import { ToolConfigurationController } from './tool-configuration.controller';

describe('ToolConfigurationController', () => {
	let module: TestingModule;
	let controller: ToolConfigurationController;

	let externalToolConfigurationUc: DeepMocked<ExternalToolConfigurationUc>;
	let externalToolMapper: DeepMocked<ExternalToolResponseMapper>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ToolConfigurationController,
				{
					provide: ExternalToolConfigurationUc,
					useValue: createMock<ExternalToolConfigurationUc>(),
				},
				{
					provide: ExternalToolResponseMapper,
					useValue: createMock<ExternalToolResponseMapper>(),
				},
			],
		}).compile();

		controller = module.get(ToolConfigurationController);
		externalToolConfigurationUc = module.get(ExternalToolConfigurationUc);
		externalToolMapper = module.get(ExternalToolResponseMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getAvailableToolsForSchool is called', () => {
		describe('when getting the list of external tools that can be added to a school', () => {
			const setup = () => {
				const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
				const idQuery: IdParams = new IdParams();
				idQuery.id = 'schoolId';
				const scopeQuery: ScopeParams = new ScopeParams();
				scopeQuery.scope = ConfigurationScope.SCHOOL;
				const externalToolDOs: ExternalToolDO[] = externalToolDOFactory.buildListWithId(2);
				const response: ToolConfigurationListResponse = new ToolConfigurationListResponse([
					new ToolConfigurationEntryResponse({
						id: 'toolId',
						name: 'toolName',
						logoUrl: 'logoUrl',
					}),
				]);

				externalToolConfigurationUc.getAvailableToolsForSchool.mockResolvedValue(externalToolDOs);
				externalToolMapper.mapExternalToolDOsToToolConfigurationListResponse.mockReturnValue(response);

				return {
					currentUser,
					idQuery,
					scopeQuery,
					response,
					externalToolDOs,
				};
			};

			it('should call externalToolConfigurationUc.getAvailableToolsForSchool', async () => {
				const { currentUser, idQuery, scopeQuery } = setup();

				await controller.getAvailableToolsForSchool(currentUser, scopeQuery, idQuery);

				expect(externalToolConfigurationUc.getAvailableToolsForSchool).toHaveBeenCalledWith(
					currentUser.userId,
					idQuery.id
				);
			});

			it('should return a list of available external tools', async () => {
				const { currentUser, idQuery, scopeQuery, response } = setup();

				const result: ToolConfigurationListResponse = await controller.getAvailableToolsForSchool(
					currentUser,
					scopeQuery,
					idQuery
				);

				expect(result).toEqual(response);
			});
		});
	});
});
