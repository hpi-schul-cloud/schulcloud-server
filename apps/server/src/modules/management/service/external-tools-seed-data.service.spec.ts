import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OauthProviderService } from '@modules/oauth-provider/domain';
import { ExternalTool, ExternalToolService, Oauth2ToolConfig } from '@modules/tool';
import { TokenEndpointAuthMethod } from '@modules/tool/common/enum';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalToolsSeedDataService } from './external-tools-seed-data.service';

describe(ExternalToolsSeedDataService.name, () => {
	let module: TestingModule;
	let service: ExternalToolsSeedDataService;

	let configService: DeepMocked<ConfigService>;
	let externalToolService: DeepMocked<ExternalToolService>;
	let oauthProviderService: DeepMocked<OauthProviderService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ExternalToolsSeedDataService,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: OauthProviderService,
					useValue: createMock<OauthProviderService>(),
				},
			],
		}).compile();

		service = module.get(ExternalToolsSeedDataService);
		configService = module.get(ConfigService);
		externalToolService = module.get(ExternalToolService);
		oauthProviderService = module.get(OauthProviderService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('import', () => {
		describe('when the nextcloud variables are defined', () => {
			const setup = () => {
				const clientId = 'Nextcloud_id';
				configService.get.mockReturnValueOnce('SchulcloudNextcloud'); // NEXTCLOUD_SOCIALLOGIN_OIDC_INTERNAL_NAME
				configService.get.mockReturnValueOnce('https://nextcloud.localhost:9090'); // NEXTCLOUD_BASE_URL
				configService.get.mockReturnValueOnce(clientId); // NEXTCLOUD_CLIENT_ID
				configService.get.mockReturnValueOnce('Nextcloud_secret'); // NEXTCLOUD_CLIENT_SECRET
				configService.get.mockReturnValueOnce('openid'); // NEXTCLOUD_SCOPES

				oauthProviderService.deleteOAuth2Client.mockRejectedValueOnce(new Error('Client not found'));

				return {
					clientId,
				};
			};

			it('should should delete any remaining oauth2 nextcloud clients', async () => {
				const { clientId } = setup();

				await service.import();

				expect(oauthProviderService.deleteOAuth2Client).toHaveBeenCalledWith(clientId);
			});

			it('should import nextcloud', async () => {
				setup();

				await service.import();

				expect(externalToolService.createExternalTool).toHaveBeenCalledWith<[ExternalTool]>(
					new ExternalTool({
						id: '65f958bdd8b35469f14032b1',
						name: 'SchulcloudNextcloud',
						config: new Oauth2ToolConfig({
							baseUrl: 'https://nextcloud.localhost:9090',
							clientId: 'Nextcloud_id',
							clientSecret: 'Nextcloud_secret',
							skipConsent: true,
							scope: 'openid',
							redirectUris: ['https://nextcloud.localhost:9090/apps/user_oidc/code'],
							frontchannelLogoutUri: 'https://nextcloud.localhost:9090/apps/schulcloud/logout',
							tokenEndpointAuthMethod: TokenEndpointAuthMethod.CLIENT_SECRET_POST,
						}),
						openNewTab: true,
						isHidden: true,
						isDeactivated: false,
						isPreferred: false,
					})
				);
			});

			it('should return 1', async () => {
				setup();

				const result = await service.import();

				expect(result).toEqual(1);
			});
		});
	});
});
