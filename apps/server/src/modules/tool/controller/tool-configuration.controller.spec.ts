import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ICurrentUser } from '@shared/domain';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { externalToolDOFactory } from '@shared/testing/factory/domainobject/external-tool.factory';
import { ExternalToolResponseMapper } from './mapper';
import { ExternalToolConfigurationUc } from '../uc/external-tool-configuration.uc';
import { ToolConfigurationController } from './tool-configuration.controller';
import { ExternalToolConfigurationTemplateResponse } from './dto/response/external-tool-configuration-template.response';
import { ToolIdParams } from './dto';

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
