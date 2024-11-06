import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDO } from '@shared/domain/domainobject';
import { userDoFactory } from '@shared/testing';
import { ToolConfigType, ToolContextType } from '../../common/enum';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ToolConfigurationStatusService } from '../../context-external-tool/service';
import { contextExternalToolFactory } from '../../context-external-tool/testing';
import { ExternalToolService } from '../../external-tool';
import { externalToolFactory } from '../../external-tool/testing';
import { SchoolExternalToolService } from '../../school-external-tool';
import { schoolExternalToolFactory } from '../../school-external-tool/testing';
import { LaunchRequestMethod, ToolLaunchData, ToolLaunchDataType, ToolLaunchRequest } from '../types';
import { BasicToolLaunchStrategy, Lti11ToolLaunchStrategy, OAuth2ToolLaunchStrategy } from './launch-strategy';
import { ToolLaunchService } from './tool-launch.service';

describe('ToolLaunchService', () => {
	let module: TestingModule;
	let service: ToolLaunchService;

	let basicToolLaunchStrategy: DeepMocked<BasicToolLaunchStrategy>;

	let toolConfigurationStatusService: DeepMocked<ToolConfigurationStatusService>;

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
		basicToolLaunchStrategy = module.get(BasicToolLaunchStrategy);

		toolConfigurationStatusService = module.get(ToolConfigurationStatusService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('generateLaunchRequest', () => {
		describe('when type basic', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();

				const externalTool = externalToolFactory.buildWithId();
				externalTool.config.type = ToolConfigType.BASIC;
				externalTool.config.baseUrl = 'https://www.basic-baseUrl.com';

				const schoolExternalTool = schoolExternalToolFactory.buildWithId({ toolId: externalTool.id });

				const contextExternalToolId = 'contextExternalToolId';
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					id: contextExternalToolId,
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId: schoolExternalTool.schoolId,
					},
					contextRef: {
						id: 'contextId',
						type: ToolContextType.COURSE,
					},
				});

				const expectedLaunchRequest: ToolLaunchRequest = new ToolLaunchRequest({
					url: 'https://example.com/tool-launch',
					method: LaunchRequestMethod.GET,
					payload: '{ "key": "value" }',
					openNewTab: false,
					isDeepLink: true,
				});

				const toolLaunchDataDO: ToolLaunchData = new ToolLaunchData({
					type: ToolLaunchDataType.BASIC,
					baseUrl: 'https://www.basic-baseurl.com/',
					properties: [],
					openNewTab: false,
				});

				toolConfigurationStatusService.determineToolConfigurationStatus.mockResolvedValue({
					isDeactivated: false,
					isNotLicensed: false,
					isIncompleteOnScopeContext: false,
					isIncompleteOperationalOnScopeContext: false,
					isOutdatedOnScopeSchool: false,
					isOutdatedOnScopeContext: false,
				});

				basicToolLaunchStrategy.createLaunchRequest.mockResolvedValueOnce(expectedLaunchRequest);

				return {
					userId,
					contextExternalTool,
					contextExternalToolId,
					expectedLaunchRequest,
					toolLaunchDataDO,
				};
			};

			it('should generate launch request ', async () => {
				const { userId, contextExternalTool, toolLaunchDataDO, expectedLaunchRequest } = setup();

				const result: ToolLaunchRequest = await service.generateLaunchRequest(userId, contextExternalTool);

				expect(result).toEqual(expectedLaunchRequest);
				expect(basicToolLaunchStrategy.createLaunchRequest).toHaveBeenCalledWith(toolLaunchDataDO);
			});
		});

		describe('when type unknown', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const user: UserDO = userDoFactory.buildWithId({ id: userId });
				const externalTool = externalToolFactory.buildWithId();
				externalTool.config.type = 'unknown' as ToolConfigType;
				externalTool.config.baseUrl = 'https://base-url.com';
				const schoolTool = schoolExternalToolFactory.buildWithId({ toolId: externalTool.id });

				const contextExternalToolId = 'contextExternalToolId';
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					id: contextExternalToolId,
					schoolToolRef: {
						schoolToolId: schoolTool.id,
						schoolId: schoolTool.schoolId,
					},
				});

				const expectedLaunchRequest: ToolLaunchRequest = new ToolLaunchRequest({
					url: 'https://example.com/tool-launch',
					method: LaunchRequestMethod.GET,
					payload: '{ "key": "value" }',
					openNewTab: false,
					isDeepLink: true,
				});

				basicToolLaunchStrategy.createLaunchRequest.mockResolvedValueOnce(expectedLaunchRequest);

				return {
					user,
					contextExternalTool,
					contextExternalToolId,
					expectedLaunchRequest,
					userId,
				};
			};

			it('should throw InternalServerErrorException', () => {
				const { userId, contextExternalTool } = setup();

				const func = () => service.generateLaunchRequest(userId, contextExternalTool);

				expect(() => func()).toThrow(new InternalServerErrorException('Unknown tool launch data type'));
			});
		});
	});
});
