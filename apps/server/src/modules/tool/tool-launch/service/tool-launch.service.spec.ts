import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
	basicToolConfigFactory,
	contextExternalToolFactory,
	externalToolFactory,
	schoolExternalToolFactory,
} from '@shared/testing';
import { Configuration } from '@hpi-schul-cloud/commons';
import { ApiValidationError } from '@shared/common';
import { ToolConfigType, ToolConfigurationStatus } from '../../common/enum';
import { CommonToolService } from '../../common/service';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { BasicToolConfig, ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { SchoolExternalToolService, SchoolExternalToolValidationService } from '../../school-external-tool/service';
import { ToolStatusOutdatedLoggableException } from '../error';
import { LaunchRequestMethod, ToolLaunchData, ToolLaunchDataType, ToolLaunchRequest } from '../types';
import {
	BasicToolLaunchStrategy,
	IToolLaunchParams,
	Lti11ToolLaunchStrategy,
	OAuth2ToolLaunchStrategy,
} from './launch-strategy';
import { ToolLaunchService } from './tool-launch.service';
import { ContextExternalToolValidationService } from '../../context-external-tool/service';

describe('ToolLaunchService', () => {
	let module: TestingModule;
	let service: ToolLaunchService;

	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let externalToolService: DeepMocked<ExternalToolService>;
	let basicToolLaunchStrategy: DeepMocked<BasicToolLaunchStrategy>;
	let commonToolService: DeepMocked<CommonToolService>;
	let contextExternalToolValidationService: DeepMocked<ContextExternalToolValidationService>;
	let schoolExternalToolValidationService: DeepMocked<SchoolExternalToolValidationService>;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				ToolLaunchService,
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: BasicToolLaunchStrategy,
					useValue: createMock<BasicToolLaunchStrategy>(),
				},
				{
					provide: Lti11ToolLaunchStrategy,
					useValue: createMock<Lti11ToolLaunchStrategy>(),
				},
				{
					provide: OAuth2ToolLaunchStrategy,
					useValue: createMock<OAuth2ToolLaunchStrategy>(),
				},
				{
					provide: CommonToolService,
					useValue: createMock<CommonToolService>(),
				},
				{
					provide: ContextExternalToolValidationService,
					useValue: createMock<ContextExternalToolValidationService>(),
				},
				{
					provide: SchoolExternalToolValidationService,
					useValue: createMock<SchoolExternalToolValidationService>(),
				},
			],
		}).compile();

		service = module.get(ToolLaunchService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		externalToolService = module.get(ExternalToolService);
		basicToolLaunchStrategy = module.get(BasicToolLaunchStrategy);
		commonToolService = module.get(CommonToolService);
		contextExternalToolValidationService = module.get(ContextExternalToolValidationService);
		schoolExternalToolValidationService = module.get(SchoolExternalToolValidationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getLaunchData', () => {
		describe('when the tool config type is BASIC', () => {
			const setup = () => {
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string)
					.build();
				const basicToolConfigDO: BasicToolConfig = basicToolConfigFactory.build();
				const externalTool: ExternalTool = externalToolFactory.build({
					config: basicToolConfigDO,
				});

				const launchDataDO: ToolLaunchData = new ToolLaunchData({
					type: ToolLaunchDataType.BASIC,
					baseUrl: 'https://www.basic-baseurl.com/',
					properties: [],
					openNewTab: false,
				});

				const launchParams: IToolLaunchParams = {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};

				schoolExternalToolService.findById.mockResolvedValue(schoolExternalTool);
				externalToolService.findById.mockResolvedValue(externalTool);
				basicToolLaunchStrategy.createLaunchData.mockResolvedValue(launchDataDO);
				commonToolService.determineToolConfigurationStatus.mockReturnValueOnce(ToolConfigurationStatus.LATEST);

				Configuration.set('FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED', false);

				return {
					launchDataDO,
					launchParams,
				};
			};

			it('should return launchData', async () => {
				const { launchParams, launchDataDO } = setup();

				const result: ToolLaunchData = await service.getLaunchData('userId', launchParams.contextExternalTool);

				expect(result).toEqual(launchDataDO);
			});

			it('should call basicToolLaunchStrategy with given launchParams ', async () => {
				const { launchParams } = setup();

				await service.getLaunchData('userId', launchParams.contextExternalTool);

				expect(basicToolLaunchStrategy.createLaunchData).toHaveBeenCalledWith('userId', launchParams);
			});

			it('should call getSchoolExternalToolById', async () => {
				const { launchParams } = setup();

				await service.getLaunchData('userId', launchParams.contextExternalTool);

				expect(schoolExternalToolService.findById).toHaveBeenCalledWith(launchParams.schoolExternalTool.id);
			});

			it('should call findExternalToolById', async () => {
				const { launchParams } = setup();

				await service.getLaunchData('userId', launchParams.contextExternalTool);

				expect(externalToolService.findById).toHaveBeenCalledWith(launchParams.schoolExternalTool.toolId);
			});

			it('should call determineToolConfigurationStatus', async () => {
				const { launchParams } = setup();

				await service.getLaunchData('userId', launchParams.contextExternalTool);

				expect(commonToolService.determineToolConfigurationStatus).toHaveBeenCalled();
			});
		});

		describe('when the tool config type is unknown', () => {
			const setup = () => {
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string)
					.build();
				const externalTool: ExternalTool = externalToolFactory.build();
				externalTool.config.type = 'unknown' as ToolConfigType;

				const launchParams: IToolLaunchParams = {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};

				schoolExternalToolService.findById.mockResolvedValue(schoolExternalTool);
				externalToolService.findById.mockResolvedValue(externalTool);
				commonToolService.determineToolConfigurationStatus.mockReturnValueOnce(ToolConfigurationStatus.LATEST);

				return {
					launchParams,
				};
			};

			it('should throw InternalServerErrorException for unknown tool config type', async () => {
				const { launchParams } = setup();

				await expect(service.getLaunchData('userId', launchParams.contextExternalTool)).rejects.toThrow(
					new InternalServerErrorException('Unknown tool config type')
				);
			});
		});

		describe('when tool configuration status is not LATEST', () => {
			const setup = () => {
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string)
					.build();
				const basicToolConfigDO: BasicToolConfig = basicToolConfigFactory.build();
				const externalTool: ExternalTool = externalToolFactory.build({
					config: basicToolConfigDO,
				});

				const launchDataDO: ToolLaunchData = new ToolLaunchData({
					type: ToolLaunchDataType.BASIC,
					baseUrl: 'https://www.basic-baseurl.com/',
					properties: [],
					openNewTab: false,
				});

				const launchParams: IToolLaunchParams = {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};

				const userId = 'userId';

				schoolExternalToolService.findById.mockResolvedValue(schoolExternalTool);
				externalToolService.findById.mockResolvedValue(externalTool);
				basicToolLaunchStrategy.createLaunchData.mockResolvedValue(launchDataDO);
				commonToolService.determineToolConfigurationStatus.mockReturnValueOnce(ToolConfigurationStatus.OUTDATED);

				return {
					launchParams,
					userId,
					contextExternalToolId: contextExternalTool.id as string,
				};
			};

			it('should throw ToolStatusOutdatedLoggableException', async () => {
				const { launchParams, userId, contextExternalToolId } = setup();

				const func = () => service.getLaunchData(userId, launchParams.contextExternalTool);

				await expect(func).rejects.toThrow(new ToolStatusOutdatedLoggableException(userId, contextExternalToolId));
			});
		});

		describe('when FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED is true', () => {
			const setup = () => {
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string)
					.build();
				const basicToolConfigDO: BasicToolConfig = basicToolConfigFactory.build();
				const externalTool: ExternalTool = externalToolFactory.build({
					config: basicToolConfigDO,
				});

				const launchDataDO: ToolLaunchData = new ToolLaunchData({
					type: ToolLaunchDataType.BASIC,
					baseUrl: 'https://www.basic-baseurl.com/',
					properties: [],
					openNewTab: false,
				});

				const userId = 'userId';

				const launchParams: IToolLaunchParams = {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};

				schoolExternalToolService.findById.mockResolvedValue(schoolExternalTool);
				externalToolService.findById.mockResolvedValue(externalTool);
				basicToolLaunchStrategy.createLaunchData.mockResolvedValue(launchDataDO);
				commonToolService.determineToolConfigurationStatus.mockReturnValueOnce(ToolConfigurationStatus.OUTDATED);

				contextExternalToolValidationService.validate.mockRejectedValueOnce(ApiValidationError);
				Configuration.set('FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED', true);

				return {
					launchParams,
					userId,
					contextExternalToolId: contextExternalTool.id as string,
				};
			};

			it('should should call validate', async () => {
				const { launchParams } = setup();

				await service.getLaunchData('userId', launchParams.contextExternalTool);

				expect(schoolExternalToolValidationService.validate).toHaveBeenCalled();
				expect(contextExternalToolValidationService.validate).toHaveBeenCalled();
			});

			it('should throw ToolStatusOutdatedLoggableException', async () => {
				const { launchParams, userId, contextExternalToolId } = setup();

				const func = () => service.getLaunchData(userId, launchParams.contextExternalTool);

				await expect(func).rejects.toThrow(new ToolStatusOutdatedLoggableException(userId, contextExternalToolId));
			});
		});
	});

	describe('generateLaunchRequest', () => {
		it('should generate launch request for BASIC type', () => {
			const toolLaunchDataDO: ToolLaunchData = new ToolLaunchData({
				type: ToolLaunchDataType.BASIC,
				baseUrl: 'https://www.basic-baseurl.com/',
				properties: [],
				openNewTab: false,
			});

			const expectedLaunchRequest: ToolLaunchRequest = new ToolLaunchRequest({
				method: LaunchRequestMethod.GET,
				url: 'https://example.com/tool-launch',
				payload: '{ "key": "value" }',
				openNewTab: false,
			});
			basicToolLaunchStrategy.createLaunchRequest.mockReturnValue(expectedLaunchRequest);

			const result: ToolLaunchRequest = service.generateLaunchRequest(toolLaunchDataDO);

			expect(result).toEqual(expectedLaunchRequest);
			expect(basicToolLaunchStrategy.createLaunchRequest).toHaveBeenCalledWith(toolLaunchDataDO);
		});

		it('should throw InternalServerErrorException for unknown type', () => {
			const toolLaunchDataDO: ToolLaunchData = new ToolLaunchData({
				type: 'unknown' as ToolLaunchDataType,
				baseUrl: 'https://www.basic-baseurl.com/',
				properties: [],
				openNewTab: false,
			});

			const func = () => service.generateLaunchRequest(toolLaunchDataDO);

			expect(() => func()).toThrow(new InternalServerErrorException('Unknown tool launch data type'));
		});
	});
});
