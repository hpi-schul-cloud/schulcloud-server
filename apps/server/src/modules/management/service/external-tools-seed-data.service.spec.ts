import { ErrorLoggable } from '@core/error/loggable';
import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { OauthProviderService } from '@modules/oauth-provider/domain';
import { ExternalToolService } from '@modules/tool';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalToolsSeedDataService } from './external-tools-seed-data.service';

describe(ExternalToolsSeedDataService.name, () => {
	let module: TestingModule;
	let service: ExternalToolsSeedDataService;

	let configService: DeepMocked<ConfigService>;
	let encryptionService: DeepMocked<EncryptionService>;
	let externalToolService: DeepMocked<ExternalToolService>;
	let oauthProviderService: DeepMocked<OauthProviderService>;
	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ExternalToolsSeedDataService,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: OauthProviderService,
					useValue: createMock<OauthProviderService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(ExternalToolsSeedDataService);
		configService = module.get(ConfigService);
		encryptionService = module.get(DefaultEncryptionService);
		externalToolService = module.get(ExternalToolService);
		oauthProviderService = module.get(OauthProviderService);
		logger = module.get(Logger);
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
				configService.get.mockReturnValueOnce('deutsch_secret'); // CTL_SEED_SECRET_ONLINE_DIA_DEUTSCH
				configService.get.mockReturnValueOnce('mathe_secret'); // CTL_SEED_SECRET_ONLINE_DIA_MATHE
				configService.get.mockReturnValueOnce('merlin_secret'); // CTL_SEED_SECRET_MERLIN

				const error = new Error('Client not found');
				oauthProviderService.deleteOAuth2Client.mockRejectedValueOnce(error);
				encryptionService.encrypt.mockReturnValueOnce('encrypted_deutsch_secret');
				encryptionService.encrypt.mockReturnValueOnce('encrypted_mathe_secret');
				encryptionService.encrypt.mockReturnValueOnce('encrypted_merlin_secret');

				return {
					clientId,
					error,
				};
			};

			it('should should delete any remaining oauth2 nextcloud clients', async () => {
				const { clientId } = setup();

				await service.import();

				expect(oauthProviderService.deleteOAuth2Client).toHaveBeenCalledWith(clientId);
			});

			it('should should log an error if no client had to be deleted', async () => {
				const { error } = setup();

				await service.import();

				expect(logger.debug).toHaveBeenCalledWith(new ErrorLoggable(error));
			});

			it.each([
				'SchulcloudNextcloud',
				'Product Test Onlinediagnose Grundschule - Deutsch',
				'Product Test Onlinediagnose Grundschule - Mathematik',
				'Merlin Bibliothek',
			])('should import %s', async (toolName: string) => {
				setup();

				await service.import();

				expect(externalToolService.createExternalTool).toHaveBeenCalledWith(
					expect.objectContaining({ name: toolName })
				);
			});

			it('should return 4', async () => {
				setup();

				const result = await service.import();

				expect(result).toEqual(4);
			});
		});
	});
});
