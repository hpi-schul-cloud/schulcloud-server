import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
	basicToolConfigDOFactory,
	contextExternalToolDOFactory,
	externalToolDOFactory,
	schoolExternalToolDOFactory,
} from '@shared/testing';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { LaunchRequestMethod, ToolLaunchData, ToolLaunchDataType, ToolLaunchRequest } from '../types';
import {
	BasicToolLaunchStrategy,
	IToolLaunchParams,
	Lti11ToolLaunchStrategy,
	OAuth2ToolLaunchStrategy,
} from './strategy';
import { ToolLaunchService } from './tool-launch.service';
import { ToolStatusOutdatedLoggableException } from '../error';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { ExternalToolService } from '../../external-tool/service';
import { CommonToolService } from '../../common/service';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { BasicToolConfigDO, ExternalTool } from '../../external-tool/domain';
import { ToolConfigType, ToolConfigurationStatus } from '../../common/enum';

describe('ToolLaunchService', () => {
	let module: TestingModule;
	let service: ToolLaunchService;

	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let externalToolService: DeepMocked<ExternalToolService>;
	let basicToolLaunchStrategy: DeepMocked<BasicToolLaunchStrategy>;
	let commonToolService: DeepMocked<CommonToolService>;

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
			],
		}).compile();

		service = module.get(ToolLaunchService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		externalToolService = module.get(ExternalToolService);
		basicToolLaunchStrategy = module.get(BasicToolLaunchStrategy);
		commonToolService = module.get(CommonToolService);
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
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolDOFactory.buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolDOFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string)
					.build();
				const basicToolConfigDO: BasicToolConfigDO = basicToolConfigDOFactory.build();
				const externalTool: ExternalTool = externalToolDOFactory.build({
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

				schoolExternalToolService.getSchoolExternalToolById.mockResolvedValue(schoolExternalTool);
				externalToolService.findExternalToolById.mockResolvedValue(externalTool);
				basicToolLaunchStrategy.createLaunchData.mockResolvedValue(launchDataDO);
				commonToolService.determineToolConfigurationStatus.mockReturnValueOnce(ToolConfigurationStatus.LATEST);

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

				expect(schoolExternalToolService.getSchoolExternalToolById).toHaveBeenCalledWith(
					launchParams.schoolExternalTool.id
				);
			});

			it('should call findExternalToolById', async () => {
				const { launchParams } = setup();

				await service.getLaunchData('userId', launchParams.contextExternalTool);

				expect(externalToolService.findExternalToolById).toHaveBeenCalledWith(launchParams.schoolExternalTool.toolId);
			});
		});

		describe('when the tool config type is unknown', () => {
			const setup = () => {
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolDOFactory.buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolDOFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string)
					.build();
				const externalTool: ExternalTool = externalToolDOFactory.build();
				externalTool.config.type = 'unknown' as ToolConfigType;

				const launchParams: IToolLaunchParams = {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};

				schoolExternalToolService.getSchoolExternalToolById.mockResolvedValue(schoolExternalTool);
				externalToolService.findExternalToolById.mockResolvedValue(externalTool);
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

			it('should call getSchoolExternalToolById', async () => {
				const { launchParams } = setup();

				try {
					await service.getLaunchData('userId', launchParams.contextExternalTool);
				} catch (exception) {
					// Do nothing
				}

				expect(schoolExternalToolService.getSchoolExternalToolById).toHaveBeenCalledWith(
					launchParams.schoolExternalTool.id
				);
			});

			it('should call findExternalToolById', async () => {
				const { launchParams } = setup();

				try {
					await service.getLaunchData('userId', launchParams.contextExternalTool);
				} catch (exception) {
					// Do nothing
				}

				expect(externalToolService.findExternalToolById).toHaveBeenCalledWith(launchParams.schoolExternalTool.toolId);
			});
		});

		describe('when tool configuration status is not LATEST', () => {
			const setup = () => {
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolDOFactory.buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolDOFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string)
					.build();
				const basicToolConfigDO: BasicToolConfigDO = basicToolConfigDOFactory.build();
				const externalTool: ExternalTool = externalToolDOFactory.build({
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

				schoolExternalToolService.getSchoolExternalToolById.mockResolvedValue(schoolExternalTool);
				externalToolService.findExternalToolById.mockResolvedValue(externalTool);
				basicToolLaunchStrategy.createLaunchData.mockResolvedValue(launchDataDO);
				commonToolService.determineToolConfigurationStatus.mockReturnValueOnce(ToolConfigurationStatus.OUTDATED);

				return {
					launchDataDO,
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
