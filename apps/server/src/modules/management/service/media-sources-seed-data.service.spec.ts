import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import {
	MediaSource,
	MediaSourceAuthMethod,
	MediaSourceDataFormat,
	MediaSourceOauthConfig,
	MediaSourceService,
	MediaSourceVidisConfig,
} from '@modules/media-source';
import { Test, TestingModule } from '@nestjs/testing';
import { MANAGEMENT_SEED_DATA_CONFIG_TOKEN, ManagementSeedDataConfig } from '../management-seed-data.config';
import { MediaSourcesSeedDataService } from './media-sources-seed-data.service';

describe(MediaSourcesSeedDataService.name, () => {
	let module: TestingModule;
	let service: MediaSourcesSeedDataService;

	let config: ManagementSeedDataConfig;
	let mediaSourceService: DeepMocked<MediaSourceService>;
	let encryptionService: DeepMocked<EncryptionService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaSourcesSeedDataService,
				{
					provide: MANAGEMENT_SEED_DATA_CONFIG_TOKEN,
					useValue: {},
				},
				{
					provide: MediaSourceService,
					useValue: createMock<MediaSourceService>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
			],
		}).compile();

		service = module.get(MediaSourcesSeedDataService);
		config = module.get(MANAGEMENT_SEED_DATA_CONFIG_TOKEN);
		mediaSourceService = module.get(MediaSourceService);
		encryptionService = module.get(DefaultEncryptionService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('import', () => {
		describe('when the vidis secrets are defined', () => {
			const setup = () => {
				config.mediaSourceVidisUsername = 'test-username';
				config.mediaSourceVidisPassword = 'test-password';
				encryptionService.encrypt.mockReturnValueOnce('encrypted-test-username');
				encryptionService.encrypt.mockReturnValueOnce('encrypted-test-password');
			};

			it('should encrypt the secrets', async () => {
				setup();

				await service.import();

				expect(encryptionService.encrypt).toHaveBeenCalledWith('test-username');
				expect(encryptionService.encrypt).toHaveBeenCalledWith('test-password');
			});

			it('should import vidis', async () => {
				setup();

				await service.import();

				expect(mediaSourceService.saveAll).toHaveBeenCalledWith<[MediaSource[]]>([
					new MediaSource({
						id: '675b0b71553441da9a893bf9',
						name: 'VIDIS',
						sourceId: 'vidis.fwu.de',
						format: MediaSourceDataFormat.VIDIS,
						vidisConfig: new MediaSourceVidisConfig({
							username: 'encrypted-test-username',
							password: 'encrypted-test-password',
							baseUrl: 'https://service-stage.vidis.schule/o/vidis-rest',
							region: 'test-region',
							schoolNumberPrefix: 'DE-VIDIS-vidis_test_',
						}),
					}),
				]);
			});

			it('should return 1', async () => {
				setup();

				const result = await service.import();

				expect(result).toEqual(1);
			});
		});

		describe('when the vidis secrets are not defined', () => {
			const setup = () => {
				config.mediaSourceVidisUsername = undefined;
				config.mediaSourceVidisPassword = undefined;
			};

			it('should not import vidis', async () => {
				setup();

				await service.import();

				expect(mediaSourceService.saveAll).not.toHaveBeenCalled();
			});

			it('should return 0', async () => {
				setup();

				const result = await service.import();

				expect(result).toEqual(0);
			});
		});

		describe('when the bilo secrets are defined', () => {
			const setup = () => {
				const biloClientId = 'test-client-id';
				const biloClientSecret = 'test-client-secret';

				config.mediaSourceBiloClientId = biloClientId;
				config.mediaSourceBiloClientSecret = biloClientSecret;

				const encryptedClientSecret = 'encrypted-test-client-secret';
				encryptionService.encrypt.mockReturnValueOnce(encryptedClientSecret);

				return { biloClientId, biloClientSecret, encryptedClientSecret };
			};

			it('should encrypt the client secret', async () => {
				const { biloClientSecret } = setup();

				await service.import();

				expect(encryptionService.encrypt).toHaveBeenCalledWith(biloClientSecret);
			});

			it('should import bilo media source', async () => {
				const { biloClientId, encryptedClientSecret } = setup();

				await service.import();

				expect(mediaSourceService.saveAll).toHaveBeenCalledWith<[MediaSource[]]>([
					new MediaSource({
						id: '679b870e987d8f9a40c1bcbb',
						name: 'Bildungslogin',
						sourceId: 'https://www.bildungslogin-test.de/api/external/univention/media',
						format: MediaSourceDataFormat.BILDUNGSLOGIN,
						oauthConfig: {
							clientId: biloClientId,
							clientSecret: encryptedClientSecret,
							authEndpoint: 'https://login.test.sso.bildungslogin.de/realms/BiLo-Broker/protocol/openid-connect/token',
							method: MediaSourceAuthMethod.CLIENT_CREDENTIALS,
							baseUrl: 'https://www.bildungslogin-test.de/api/external/univention/media',
						} as MediaSourceOauthConfig,
					}),
				]);
			});

			it('should return 1', async () => {
				setup();

				const result = await service.import();

				expect(result).toEqual(1);
			});
		});

		describe('when the bilo secrets are not defined', () => {
			const setup = () => {
				config.mediaSourceBiloClientId = undefined;
				config.mediaSourceBiloClientSecret = undefined;
			};

			it('should not import bilo media source', async () => {
				setup();

				await service.import();

				expect(mediaSourceService.saveAll).not.toHaveBeenCalled();
			});

			it('should return 0', async () => {
				setup();

				const result = await service.import();

				expect(result).toEqual(0);
			});
		});

		describe('when more than one secrets are defined', () => {
			const setup = () => {
				config.mediaSourceVidisUsername = 'test-vidis-username';
				config.mediaSourceVidisPassword = 'test-vidis-password';
				config.mediaSourceBiloClientId = 'test-bilo-client-id';
				config.mediaSourceBiloClientSecret = 'test-bilo-client-secret';
			};

			it('should return the number of media source imported', async () => {
				setup();

				const result = await service.import();

				expect(result).toEqual(2);
			});
		});
	});
});
