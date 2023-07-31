import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LtiToolDO } from '@shared/domain';
import { externalToolDOFactory, ltiToolDOFactory, setupEntities } from '@shared/testing';
import { LtiToolService } from '@src/modules/lti-tool';
import { ExternalTool } from '@src/modules/tool/external-tool/domain';
import { ExternalToolService } from '@src/modules/tool/external-tool/service';
import { OauthProviderLoginFlowService } from './oauth-provider.login-flow.service';

describe('OauthProviderLoginFlowService', () => {
	let module: TestingModule;
	let service: OauthProviderLoginFlowService;

	let ltiToolService: DeepMocked<LtiToolService>;
	let externalToolService: DeepMocked<ExternalToolService>;

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
			],
		}).compile();

		service = module.get(OauthProviderLoginFlowService);
		ltiToolService = module.get(LtiToolService);
		externalToolService = module.get(ExternalToolService);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findToolByClientId', () => {
		describe('when it finds a ctl tool', () => {
			const setup = () => {
				const tool: ExternalTool = externalToolDOFactory.buildWithId({ name: 'SchulcloudNextcloud' });

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

		describe('when it finds a lti tool', () => {
			const setup = () => {
				const tool: LtiToolDO = ltiToolDOFactory.buildWithId({ name: 'SchulcloudNextcloud' });

				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(null);
				ltiToolService.findByClientIdAndIsLocal.mockResolvedValue(tool);

				return {
					tool,
				};
			};

			it('should return a lti tool', async () => {
				const { tool } = setup();

				const result: ExternalTool | LtiToolDO = await service.findToolByClientId('clientId');

				expect(result).toEqual(tool);
			});
		});

		describe('when no tool was found', () => {
			const setup = () => {
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
				const tool: ExternalTool = externalToolDOFactory.buildWithId({ name: 'SchulcloudNextcloud' });

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
				const tool: ExternalTool = externalToolDOFactory.buildWithId({ name: 'NotSchulcloudNextcloud' });

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
