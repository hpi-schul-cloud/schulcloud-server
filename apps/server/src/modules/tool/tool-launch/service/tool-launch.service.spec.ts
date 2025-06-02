import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { ExternalToolMediumStatus } from '@modules/tool/external-tool/enum';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain/types';
import { ToolConfigType } from '../../common/enum';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ToolConfigurationStatusService } from '../../context-external-tool/service';
import { contextExternalToolFactory } from '../../context-external-tool/testing';
import { ExternalToolService } from '../../external-tool';
import { externalToolFactory } from '../../external-tool/testing';
import { SchoolExternalToolService } from '../../school-external-tool';
import { schoolExternalToolFactory } from '../../school-external-tool/testing';
import { ToolStatusNotLaunchableLoggableException } from '../error';
import { toolLaunchRequestFactory } from '../testing';
import { ToolLaunchRequest } from '../types';
import {
	BasicToolLaunchStrategy,
	Lti11ToolLaunchStrategy,
	OAuth2ToolLaunchStrategy,
	ToolLaunchParams,
} from './launch-strategy';
import { ToolLaunchService } from './tool-launch.service';

describe(ToolLaunchService.name, () => {
	let module: TestingModule;
	let service: ToolLaunchService;

	let basicToolLaunchStrategy: DeepMocked<BasicToolLaunchStrategy>;
	let lti11ToolLaunchStrategy: DeepMocked<Lti11ToolLaunchStrategy>;
	let oauth2ToolLaunchStrategy: DeepMocked<OAuth2ToolLaunchStrategy>;

	let toolConfigurationStatusService: DeepMocked<ToolConfigurationStatusService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let externalToolService: DeepMocked<ExternalToolService>;

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
		lti11ToolLaunchStrategy = module.get(Lti11ToolLaunchStrategy);
		oauth2ToolLaunchStrategy = module.get(OAuth2ToolLaunchStrategy);

		toolConfigurationStatusService = module.get(ToolConfigurationStatusService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('generateLaunchRequest', () => {
		describe('when the tool type is basic', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const externalTool = externalToolFactory.withBasicConfig().build();
				const schoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool.id });
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId: schoolExternalTool.schoolId,
					},
				});

				const expectedLaunchRequest: ToolLaunchRequest = toolLaunchRequestFactory.build();

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findById.mockResolvedValueOnce(externalTool);
				toolConfigurationStatusService.determineToolConfigurationStatus.mockResolvedValueOnce({
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
					expectedLaunchRequest,
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should use the basic strategy', async () => {
				const { userId, externalTool, schoolExternalTool, contextExternalTool } = setup();

				await service.generateLaunchRequest(userId, contextExternalTool);

				expect(basicToolLaunchStrategy.createLaunchRequest).toHaveBeenCalledWith<[EntityId, ToolLaunchParams]>(userId, {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				});
			});

			it('should generate launch request ', async () => {
				const { userId, contextExternalTool, expectedLaunchRequest } = setup();

				const result: ToolLaunchRequest = await service.generateLaunchRequest(userId, contextExternalTool);

				expect(result).toEqual(expectedLaunchRequest);
			});
		});

		describe('when the tool type is lti11', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const externalTool = externalToolFactory.withLti11Config().build();
				const schoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool.id });
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId: schoolExternalTool.schoolId,
					},
				});

				const expectedLaunchRequest: ToolLaunchRequest = toolLaunchRequestFactory.build();

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findById.mockResolvedValueOnce(externalTool);
				toolConfigurationStatusService.determineToolConfigurationStatus.mockResolvedValueOnce({
					isDeactivated: false,
					isNotLicensed: false,
					isIncompleteOnScopeContext: false,
					isIncompleteOperationalOnScopeContext: false,
					isOutdatedOnScopeSchool: false,
					isOutdatedOnScopeContext: false,
				});
				lti11ToolLaunchStrategy.createLaunchRequest.mockResolvedValueOnce(expectedLaunchRequest);

				return {
					userId,
					expectedLaunchRequest,
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should use the lti11 strategy', async () => {
				const { userId, externalTool, schoolExternalTool, contextExternalTool } = setup();

				await service.generateLaunchRequest(userId, contextExternalTool);

				expect(lti11ToolLaunchStrategy.createLaunchRequest).toHaveBeenCalledWith<[EntityId, ToolLaunchParams]>(userId, {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				});
			});

			it('should generate launch request ', async () => {
				const { userId, contextExternalTool, expectedLaunchRequest } = setup();

				const result: ToolLaunchRequest = await service.generateLaunchRequest(userId, contextExternalTool);

				expect(result).toEqual(expectedLaunchRequest);
			});
		});

		describe('when the tool type is oauth2', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const externalTool = externalToolFactory.withOauth2Config().build();
				const schoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool.id });
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId: schoolExternalTool.schoolId,
					},
				});

				const expectedLaunchRequest: ToolLaunchRequest = toolLaunchRequestFactory.build();

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findById.mockResolvedValueOnce(externalTool);
				toolConfigurationStatusService.determineToolConfigurationStatus.mockResolvedValueOnce({
					isDeactivated: false,
					isNotLicensed: false,
					isIncompleteOnScopeContext: false,
					isIncompleteOperationalOnScopeContext: false,
					isOutdatedOnScopeSchool: false,
					isOutdatedOnScopeContext: false,
				});
				oauth2ToolLaunchStrategy.createLaunchRequest.mockResolvedValueOnce(expectedLaunchRequest);

				return {
					userId,
					expectedLaunchRequest,
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should use the oauth2 strategy', async () => {
				const { userId, externalTool, schoolExternalTool, contextExternalTool } = setup();

				await service.generateLaunchRequest(userId, contextExternalTool);

				expect(oauth2ToolLaunchStrategy.createLaunchRequest).toHaveBeenCalledWith<[EntityId, ToolLaunchParams]>(
					userId,
					{
						externalTool,
						schoolExternalTool,
						contextExternalTool,
					}
				);
			});

			it('should generate launch request ', async () => {
				const { userId, contextExternalTool, expectedLaunchRequest } = setup();

				const result: ToolLaunchRequest = await service.generateLaunchRequest(userId, contextExternalTool);

				expect(result).toEqual(expectedLaunchRequest);
			});
		});

		describe('when the tool is a non active medium', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const externalTool = externalToolFactory.withMedium({ status: ExternalToolMediumStatus.DRAFT }).build();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({ toolId: externalTool.id });
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId: schoolExternalTool.schoolId,
					},
				});

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findById.mockResolvedValueOnce(externalTool);
				toolConfigurationStatusService.determineToolConfigurationStatus.mockResolvedValueOnce({
					isDeactivated: false,
					isNotLicensed: false,
					isIncompleteOnScopeContext: false,
					isIncompleteOperationalOnScopeContext: false,
					isOutdatedOnScopeSchool: false,
					isOutdatedOnScopeContext: false,
				});

				return {
					contextExternalTool,
					userId,
				};
			};

			it('should throw InternalServerErrorException', async () => {
				const { userId, contextExternalTool } = setup();

				await expect(() => service.generateLaunchRequest(userId, contextExternalTool)).rejects.toThrow(
					new InternalServerErrorException('Medium is not active')
				);
			});
		});

		describe('when the tool type is unknown', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const externalTool = externalToolFactory.build();
				externalTool.config.type = 'unknown' as ToolConfigType;
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({ toolId: externalTool.id });
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId: schoolExternalTool.schoolId,
					},
				});

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findById.mockResolvedValueOnce(externalTool);
				toolConfigurationStatusService.determineToolConfigurationStatus.mockResolvedValueOnce({
					isDeactivated: false,
					isNotLicensed: false,
					isIncompleteOnScopeContext: false,
					isIncompleteOperationalOnScopeContext: false,
					isOutdatedOnScopeSchool: false,
					isOutdatedOnScopeContext: false,
				});

				return {
					contextExternalTool,
					userId,
				};
			};

			it('should throw InternalServerErrorException', async () => {
				const { userId, contextExternalTool } = setup();

				await expect(() => service.generateLaunchRequest(userId, contextExternalTool)).rejects.toThrow(
					new InternalServerErrorException('Unknown tool launch data type')
				);
			});
		});

		describe.each([
			{ isDeactivated: true },
			{ isNotLicensed: true },
			{ isIncompleteOnScopeContext: true },
			{ isOutdatedOnScopeSchool: true },
			{ isOutdatedOnScopeContext: true },
		])('when the tool status is %o', (status) => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const externalTool = externalToolFactory.build();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({ toolId: externalTool.id });
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId: schoolExternalTool.schoolId,
					},
				});

				schoolExternalToolService.findById.mockResolvedValue(schoolExternalTool);
				externalToolService.findById.mockResolvedValue(externalTool);
				toolConfigurationStatusService.determineToolConfigurationStatus.mockResolvedValue({
					isDeactivated: false,
					isNotLicensed: false,
					isIncompleteOnScopeContext: false,
					isIncompleteOperationalOnScopeContext: false,
					isOutdatedOnScopeSchool: false,
					isOutdatedOnScopeContext: false,
					...status,
				});

				return {
					contextExternalTool,
					userId,
				};
			};

			it('should throw ToolStatusNotLaunchableLoggableException', async () => {
				const { userId, contextExternalTool } = setup();

				await expect(() => service.generateLaunchRequest(userId, contextExternalTool)).rejects.toThrow(
					ToolStatusNotLaunchableLoggableException
				);
			});
		});
	});
});
