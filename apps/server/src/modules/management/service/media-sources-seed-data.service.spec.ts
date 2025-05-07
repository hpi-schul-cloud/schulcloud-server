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
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MediaSourcesSeedDataService } from './media-sources-seed-data.service';

describe(MediaSourcesSeedDataService.name, () => {
	let module: TestingModule;
	let service: MediaSourcesSeedDataService;

	let configService: DeepMocked<ConfigService>;
	let mediaSourceService: DeepMocked<MediaSourceService>;
	let encryptionService: DeepMocked<EncryptionService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaSourcesSeedDataService,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
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
		configService = module.get(ConfigService);
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
				configService.get.mockReturnValueOnce('test-username');
				configService.get.mockReturnValueOnce('test-password');
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
				configService.get.mockReturnValueOnce(undefined);
				configService.get.mockReturnValueOnce(undefined);
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

				configService.get.mockImplementation((key: string) => {
					switch (key) {
						case 'MEDIA_SOURCE_BILO_CLIENT_ID':
							return biloClientId;
						case 'MEDIA_SOURCE_BILO_CLIENT_SECRET':
							return biloClientSecret;
						default:
							return undefined;
					}
				});

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
				configService.get.mockImplementation((key: string) => {
					switch (key) {
						case 'MEDIA_SOURCE_BILO_CLIENT_ID':
						case 'MEDIA_SOURCE_BILO_CLIENT_SECRET':
						default:
							return undefined;
					}
				});
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
				configService.get.mockImplementation((key: string) => {
					switch (key) {
						case 'MEDIA_SOURCE_VIDIS_USERNAME':
							return 'test-vidis-username';
						case 'MEDIA_SOURCE_VIDIS_PASSWORD':
							return 'test-vidis-password';
						case 'MEDIA_SOURCE_BILO_CLIENT_ID':
							return 'test-bilo-client-id';
						case 'MEDIA_SOURCE_BILO_CLIENT_SECRET':
							return 'test-bilo-client-secret';
						default:
							return undefined;
					}
				});
			};

			it('should return the number of media source imported', async () => {
				setup();

				const result = await service.import();

				expect(result).toEqual(2);
			});
		});
	});
});
