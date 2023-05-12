import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { ExternalToolDO } from '@shared/domain/domainobject/tool';
import { externalToolDOFactory } from '@shared/testing/factory/domainobject/tool/external-tool.factory';
import { ConfigurationScope } from '../interface';
import { ExternalToolConfigurationUc } from '../uc/external-tool-configuration.uc';
import {
	ToolIdParams,
	IdParams,
	ScopeParams,
	ToolConfigurationEntryResponse,
	ToolConfigurationListResponse,
	ExternalToolConfigurationTemplateResponse,
} from './dto';
import { ExternalToolResponseMapper } from './mapper';
import { ToolConfigurationController } from './tool-configuration.controller';

describe('ToolConfigurationController', () => {
	let module: TestingModule;
	let controller: ToolConfigurationController;

	let externalToolConfigurationUc: DeepMocked<ExternalToolConfigurationUc>;
	let externalToolResponseMapper: DeepMocked<ExternalToolResponseMapper>;

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
		externalToolResponseMapper = module.get(ExternalToolResponseMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	const setupExternalTool = () => {
		const currentUser: ICurrentUser = { userId: 'userId', schoolId: 'schoolId' } as ICurrentUser;
		const toolIdParams: ToolIdParams = new ToolIdParams();
		toolIdParams.toolId = 'toolId';

		const mockResponse: ExternalToolConfigurationTemplateResponse = new ExternalToolConfigurationTemplateResponse({
			id: 'toolId',
			name: 'toolName',
			logoUrl: 'logoUrl',
			parameters: [],
			version: 1,
		});

		const externalToolDO: ExternalToolDO = externalToolDOFactory.withCustomParameters(1).buildWithId();

		externalToolConfigurationUc.getExternalToolForSchool.mockResolvedValue(externalToolDO);
		externalToolResponseMapper.mapToConfigurationTemplateResponse.mockReturnValue(mockResponse);

		return {
			currentUser,
			toolIdParams,
			mockResponse,
			externalToolDO,
		};
	};

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
				externalToolResponseMapper.mapExternalToolDOsToToolConfigurationListResponse.mockReturnValue(response);

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

	describe('getExternalToolForScope', () => {
		describe('when scope "school" is given', () => {
			it('should call the uc to fetch a tool', async () => {
				const { currentUser, toolIdParams } = setupExternalTool();

				await controller.getExternalToolForScope(currentUser, toolIdParams);

				expect(externalToolConfigurationUc.getExternalToolForSchool).toHaveBeenCalledWith(
					currentUser.userId,
					toolIdParams.toolId,
					currentUser.schoolId
				);
			});

			it('should return a tool', async () => {
				const { currentUser, toolIdParams, mockResponse } = setupExternalTool();

				const result: ExternalToolConfigurationTemplateResponse = await controller.getExternalToolForScope(
					currentUser,
					toolIdParams
				);

				expect(result).toEqual(mockResponse);
			});
		});
	});
});
