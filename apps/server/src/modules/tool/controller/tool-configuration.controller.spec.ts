import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ICurrentUser } from '@shared/domain';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { externalToolDOFactory } from '@shared/testing/factory/domainobject/external-tool.factory';
import { IdQuery, SchoolExternalToolListResponse, SchoolExternalToolResponse, ScopeQuery } from './dto';
import { ExternalToolResponseMapper } from './mapper';
import { ExternalToolConfigurationUc } from '../uc/tool-configuration.uc';
import { ToolConfigurationController } from './tool-configuration.controller';
import { ConfigurationScope } from '../interface';

describe('SchoolExternalToolController', () => {
	let module: TestingModule;
	let controller: ToolConfigurationController;

	let schoolExternalToolUc: DeepMocked<ExternalToolConfigurationUc>;
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
		schoolExternalToolUc = module.get(ExternalToolConfigurationUc);
		externalToolMapper = module.get(ExternalToolResponseMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getAvailableToolsForSchool is called', () => {
		describe('when getting the list of external tools that can be added to a school', () => {
			const setup = () => {
				const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
				const idQuery: IdQuery = new IdQuery();
				idQuery.id = 'schoolId';
				const scopeQuery: ScopeQuery = new ScopeQuery();
				scopeQuery.scope = ConfigurationScope.SCHOOL;
				const externalToolDOs: ExternalToolDO[] = externalToolDOFactory.buildListWithId(2);
				const response: SchoolExternalToolListResponse = new SchoolExternalToolListResponse([
					new SchoolExternalToolResponse({
						id: 'toolId',
						name: 'toolName',
						logoUrl: 'logoUrl',
					}),
				]);

				schoolExternalToolUc.getAvailableToolsForSchool.mockResolvedValue(externalToolDOs);
				externalToolMapper.mapExternalToolDOsToSchoolExternalToolListResponse.mockReturnValue(response);

				return {
					currentUser,
					idQuery,
					scopeQuery,
					response,
					externalToolDOs,
				};
			};

			it('should call schoolExternalToolUc.getAvailableToolsForSchool', async () => {
				const { currentUser, idQuery, scopeQuery } = setup();

				await controller.getAvailableToolsForSchool(currentUser, scopeQuery, idQuery);

				expect(schoolExternalToolUc.getAvailableToolsForSchool).toHaveBeenCalledWith(currentUser.userId, idQuery.id);
			});

			it('should return a list of available external tools', async () => {
				const { currentUser, idQuery, scopeQuery, response } = setup();

				const result: SchoolExternalToolListResponse = await controller.getAvailableToolsForSchool(
					currentUser,
					scopeQuery,
					idQuery
				);

				expect(result).toEqual(response);
			});
		});
	});
});
