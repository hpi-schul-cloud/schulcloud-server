import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LtiToolService } from '@modules/lti-tool';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { ExternalToolService } from '@modules/tool/external-tool/service';
import { externalToolFactory } from '@modules/tool/external-tool/testing';
import { ToolConfig } from '@modules/tool/tool-config';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LtiToolDO } from '@shared/domain/domainobject';
import { ltiToolDOFactory, setupEntities } from '@shared/testing';
import { OauthProviderLoginFlowService } from './oauth-provider.login-flow.service';

describe(OauthProviderLoginFlowService.name, () => {
	let module: TestingModule;
	let service: OauthProviderLoginFlowService;

	let ltiToolService: DeepMocked<LtiToolService>;
	let externalToolService: DeepMocked<ExternalToolService>;
	let configService: DeepMocked<ConfigService<ToolConfig, true>>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OauthProviderLoginFlowService,
				{
					provide: LtiToolService,
					useValue: createMock<LtiToolService>(),
				},
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<ToolConfig, true>>(),
				},
			],
		}).compile();

		service = module.get(OauthProviderLoginFlowService);
		ltiToolService = module.get(LtiToolService);
		externalToolService = module.get(ExternalToolService);
		configService = module.get(ConfigService);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findToolByClientId', () => {
		describe('when it finds a ctl tool and the ctl feature is active', () => {
			const setup = () => {
				configService.get.mockReturnValue(true);

				const tool: ExternalTool = externalToolFactory.buildWithId({ name: 'SchulcloudNextcloud' });

				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(tool);
				ltiToolService.findByClientIdAndIsLocal.mockResolvedValue(null);

				return {
					tool,
				};
			};

			it('should return a ctl tool', async () => {
				const { tool } = setup();

				const result: ExternalTool | LtiToolDO = await service.findToolByClientId('clientId');

				expect(result).toEqual(tool);
			});
		});

		describe('when a lti tool exists and the ctl feature is deactivated', () => {
			const setup = () => {
				configService.get.mockReturnValue(false);

				const tool: LtiToolDO = ltiToolDOFactory.buildWithId({ name: 'SchulcloudNextcloud' });

				ltiToolService.findByClientIdAndIsLocal.mockResolvedValue(tool);

				return {
					tool,
				};
			};

			it('should not search for ctl tools', async () => {
				setup();

				await service.findToolByClientId('clientId');

				expect(externalToolService.findExternalToolByOAuth2ConfigClientId).not.toHaveBeenCalled();
			});

			it('should find a lti tool', async () => {
				const { tool } = setup();

				const result = await service.findToolByClientId('clientId');

				expect(result).toEqual(tool);
			});
		});

		describe('when a lti tool exists and the ctl feature is active and no ctl tool exists', () => {
			const setup = () => {
				configService.get.mockReturnValue(true);

				const tool: LtiToolDO = ltiToolDOFactory.buildWithId({ name: 'SchulcloudNextcloud' });

				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(null);
				ltiToolService.findByClientIdAndIsLocal.mockResolvedValue(tool);

				return {
					tool,
				};
			};

			it('should search for the ctl tool', async () => {
				setup();

				await service.findToolByClientId('clientId');

				expect(externalToolService.findExternalToolByOAuth2ConfigClientId).toHaveBeenCalled();
			});

			it('should return a lti tool', async () => {
				const { tool } = setup();

				const result: ExternalTool | LtiToolDO = await service.findToolByClientId('clientId');

				expect(result).toEqual(tool);
			});
		});

		describe('when no lti or ctl tool was found', () => {
			const setup = () => {
				configService.get.mockReturnValue(true);

				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(null);
				ltiToolService.findByClientIdAndIsLocal.mockResolvedValue(null);
			};

			it('should throw a NotFoundException', async () => {
				setup();

				const func = async () => service.findToolByClientId('clientId');

				await expect(func).rejects.toThrow(
					new NotFoundException('Unable to find ExternalTool or LtiTool for clientId: clientId')
				);
			});
		});
	});

	describe('isNextcloudTool', () => {
		describe('when it is Nextcloud', () => {
			const setup = () => {
				const tool: ExternalTool = externalToolFactory.buildWithId({ name: 'SchulcloudNextcloud' });

				return {
					tool,
				};
			};

			it('should return true', () => {
				const { tool } = setup();

				const result: boolean = service.isNextcloudTool(tool);

				expect(result).toEqual(true);
			});
		});

		describe('when it is not Nextcloud', () => {
			const setup = () => {
				const tool: ExternalTool = externalToolFactory.buildWithId({ name: 'NotSchulcloudNextcloud' });

				return {
					tool,
				};
			};

			it('should return false', () => {
				const { tool } = setup();

				const result: boolean = service.isNextcloudTool(tool);

				expect(result).toEqual(false);
			});
		});
	});
});
