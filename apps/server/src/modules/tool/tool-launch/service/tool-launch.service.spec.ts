import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
	basicToolConfigFactory,
	contextExternalToolFactory,
	externalToolFactory,
	schoolExternalToolFactory,
	toolConfigurationStatusFactory,
} from '@shared/testing';
import { ToolConfigType } from '../../common/enum';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { BasicToolConfig, ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool';
import { SchoolExternalToolWithId } from '../../school-external-tool/domain';
import { SchoolExternalToolService } from '../../school-external-tool';
import { ToolStatusNotLaunchableLoggableException } from '../error';
import { LaunchRequestMethod, ToolLaunchData, ToolLaunchDataType, ToolLaunchRequest } from '../types';
import {
	BasicToolLaunchStrategy,
	Lti11ToolLaunchStrategy,
	OAuth2ToolLaunchStrategy,
	ToolLaunchParams,
} from './launch-strategy';
import { ToolLaunchService } from './tool-launch.service';
import { ToolConfigurationStatusService } from '../../context-external-tool/service';

describe('ToolLaunchService', () => {
	let module: TestingModule;
	let service: ToolLaunchService;

	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let externalToolService: DeepMocked<ExternalToolService>;
	let basicToolLaunchStrategy: DeepMocked<BasicToolLaunchStrategy>;
	let toolVersionService: DeepMocked<ToolConfigurationStatusService>;

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
					provide: ToolConfigurationStatusService,
					useValue: createMock<ToolConfigurationStatusService>(),
				},
			],
		}).compile();

		service = module.get(ToolLaunchService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		externalToolService = module.get(ExternalToolService);
		basicToolLaunchStrategy = module.get(BasicToolLaunchStrategy);
		toolVersionService = module.get(ToolConfigurationStatusService);
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
				const schoolExternalTool = schoolExternalToolFactory.buildWithId() as SchoolExternalToolWithId;
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id)
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

				const launchParams: ToolLaunchParams = {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};

				schoolExternalToolService.findById.mockResolvedValue(schoolExternalTool);
				externalToolService.findById.mockResolvedValue(externalTool);
				basicToolLaunchStrategy.createLaunchData.mockResolvedValue(launchDataDO);
				toolVersionService.determineToolConfigurationStatus.mockReturnValueOnce(
					toolConfigurationStatusFactory.build({
						isOutdatedOnScopeContext: false,
						isOutdatedOnScopeSchool: false,
						isIncompleteOnScopeContext: false,
					})
				);

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

			it('should call toolVersionService', async () => {
				const { launchParams } = setup();

				await service.getLaunchData('userId', launchParams.contextExternalTool);

				expect(toolVersionService.determineToolConfigurationStatus).toHaveBeenCalled();
			});
		});

		describe('when the tool config type is unknown', () => {
			const setup = () => {
				const schoolExternalTool = schoolExternalToolFactory.buildWithId() as SchoolExternalToolWithId;
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id)
					.build();
				const externalTool: ExternalTool = externalToolFactory.build();
				externalTool.config.type = 'unknown' as ToolConfigType;

				const launchParams: ToolLaunchParams = {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};

				schoolExternalToolService.findById.mockResolvedValue(schoolExternalTool);
				externalToolService.findById.mockResolvedValue(externalTool);
				toolVersionService.determineToolConfigurationStatus.mockReturnValueOnce(
					toolConfigurationStatusFactory.build({
						isOutdatedOnScopeContext: false,
						isOutdatedOnScopeSchool: false,
						isIncompleteOnScopeContext: false,
					})
				);

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

		describe('when tool configuration status is not launchable', () => {
			const setup = () => {
				const schoolExternalTool = schoolExternalToolFactory.buildWithId() as SchoolExternalToolWithId;
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id)
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

				const launchParams: ToolLaunchParams = {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};

				const userId = 'userId';

				schoolExternalToolService.findById.mockResolvedValue(schoolExternalTool);
				externalToolService.findById.mockResolvedValue(externalTool);
				basicToolLaunchStrategy.createLaunchData.mockResolvedValue(launchDataDO);
				toolVersionService.determineToolConfigurationStatus.mockReturnValueOnce(
					toolConfigurationStatusFactory.build({
						isOutdatedOnScopeContext: true,
						isOutdatedOnScopeSchool: true,
						isIncompleteOnScopeContext: false,
						isIncompleteOperationalOnScopeContext: false,
						isDeactivated: true,
					})
				);

				return {
					launchParams,
					userId,
					contextExternalToolId: contextExternalTool.id as string,
				};
			};

			it('should throw ToolStatusNotLaunchableLoggableException', async () => {
				const { launchParams, userId, contextExternalToolId } = setup();

				const func = () => service.getLaunchData(userId, launchParams.contextExternalTool);

				await expect(func).rejects.toThrow(
					new ToolStatusNotLaunchableLoggableException(userId, contextExternalToolId, true, true, false, false, true)
				);
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
