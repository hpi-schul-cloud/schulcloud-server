import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ICurrentUser } from '@shared/domain';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { externalToolDOFactory } from '@shared/testing/factory/domainobject/external-tool.factory';
import { ExternalToolResponseMapper } from './mapper';
import { ExternalToolConfigurationUc } from '../uc/external-tool-configuration.uc';
import { ToolConfigurationController } from './tool-configuration.controller';
import { ExternalToolConfigurationTemplateResponse } from './dto/response/external-tool-configuration-template.response';
import { ScopeQuery, ToolIdParams } from './dto';
import { ConfigurationScope } from '../interface';

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
		const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;

		const toolIdParams: ToolIdParams = new ToolIdParams();
		toolIdParams.toolId = 'toolId';
		const scopeQuery: ScopeQuery = new ScopeQuery();
		scopeQuery.scope = ConfigurationScope.SCHOOL;

		const mockResponse: ExternalToolConfigurationTemplateResponse = new ExternalToolConfigurationTemplateResponse({
			id: 'toolId',
			name: 'toolName',
			logoUrl: 'logoUrl',
			parameters: [],
			version: 1,
		});

		const externalToolDO: ExternalToolDO = externalToolDOFactory.withCustomParameters(1).buildWithId();

		externalToolConfigurationUc.getExternalToolForScope.mockResolvedValue(externalToolDO);
		externalToolResponseMapper.mapToConfigurationTemplateResponse.mockReturnValue(mockResponse);

		return {
			currentUser,
			toolIdParams,
			scopeQuery,
			mockResponse,
			externalToolDO,
		};
	};

	describe('getExternalToolForScope', () => {
		describe('when scope "school" is given', () => {
			it('should call the uc to fetch a tool', async () => {
				const { currentUser, toolIdParams, scopeQuery } = setupExternalTool();

				await controller.getExternalToolForScope(currentUser, toolIdParams, scopeQuery);

				expect(externalToolConfigurationUc.getExternalToolForScope).toHaveBeenCalledWith(
					currentUser.userId,
					toolIdParams.toolId,
					scopeQuery.scope
				);
			});

			it('should return a tool', async () => {
				const { currentUser, toolIdParams, scopeQuery, mockResponse } = setupExternalTool();

				const result: ExternalToolConfigurationTemplateResponse = await controller.getExternalToolForScope(
					currentUser,
					toolIdParams,
					scopeQuery
				);

				expect(result).toEqual(mockResponse);
			});
		});
	});
});
