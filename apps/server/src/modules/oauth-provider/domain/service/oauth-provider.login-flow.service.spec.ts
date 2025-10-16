import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { ExternalToolService } from '@modules/tool/external-tool/service';
import { externalToolFactory } from '@modules/tool/external-tool/testing';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OauthProviderLoginFlowService } from './oauth-provider.login-flow.service';

describe(OauthProviderLoginFlowService.name, () => {
	let module: TestingModule;
	let service: OauthProviderLoginFlowService;

	let externalToolService: DeepMocked<ExternalToolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OauthProviderLoginFlowService,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
			],
		}).compile();

		service = module.get(OauthProviderLoginFlowService);
		externalToolService = module.get(ExternalToolService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findToolByClientId', () => {
		describe('when it finds a tool', () => {
			const setup = () => {
				const tool: ExternalTool = externalToolFactory.buildWithId({ name: 'SchulcloudNextcloud' });

				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(tool);

				return {
					tool,
				};
			};

			it('should return a tool', async () => {
				const { tool } = setup();

				const result: ExternalTool = await service.findToolByClientId('clientId');

				expect(result).toEqual(tool);
			});
		});

		describe('when no tool was found', () => {
			const setup = () => {
				externalToolService.findExternalToolByOAuth2ConfigClientId.mockResolvedValue(null);
			};

			it('should throw a NotFoundException', async () => {
				setup();

				const func = async () => service.findToolByClientId('clientId');

				await expect(func).rejects.toThrow(new NotFoundException('Unable to find ExternalTool for clientId: clientId'));
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
