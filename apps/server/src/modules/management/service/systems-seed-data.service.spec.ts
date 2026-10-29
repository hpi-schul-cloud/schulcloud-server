import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { DefaultEncryptionService, type EncryptionService } from '@infra/encryption';
import { OauthConfig, System, SystemService } from '@modules/system';
import { Test, type TestingModule } from '@nestjs/testing';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SchulcloudTheme } from '@shared/domain/types';
import { MANAGEMENT_SEED_DATA_CONFIG_TOKEN, type ManagementSeedDataConfig } from '../management-seed-data.config';
import { SystemsSeedDataService } from './systems-seed-data.service';

describe(SystemsSeedDataService.name, () => {
	let module: TestingModule;
	let service: SystemsSeedDataService;

	let config: ManagementSeedDataConfig;
	let systemService: DeepMocked<SystemService>;
	let encryptionService: DeepMocked<EncryptionService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SystemsSeedDataService,
				{
					provide: MANAGEMENT_SEED_DATA_CONFIG_TOKEN,
					useValue: {},
				},
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
			],
		}).compile();

		service = module.get(SystemsSeedDataService);
		config = module.get(MANAGEMENT_SEED_DATA_CONFIG_TOKEN);
		systemService = module.get(SystemService);
		encryptionService = module.get(DefaultEncryptionService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('import', () => {
		describe('when the environment is nbc and moin.schule client id and secret are defined', () => {
			const setup = () => {
				config.scTheme = SchulcloudTheme.NIEDERSACHSEN;
				config.schulconnexClientId = 'client-id';
				config.schulconnexClientSecret = 'client-secret';
				encryptionService.encrypt.mockReturnValueOnce('encrypted-client-secret');
			};

			it('should encrypt the secret', async () => {
				setup();

				await service.import();

				expect(encryptionService.encrypt).toHaveBeenCalledWith('client-secret');
			});

			it('should import moin.schule', async () => {
				setup();

				await service.import();

				expect(systemService.save).toHaveBeenCalledWith<[System]>(
					new System({
						id: '0000d186816abba584714c93',
						alias: 'moin.schule',
						displayName: 'moin.schule',
						type: 'oauth',
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
						provisioningUrl: 'https://api-dienste.stage.niedersachsen-login.schule/v1/person-info',
						oauthConfig: new OauthConfig({
							clientId: 'client-id',
							clientSecret: 'encrypted-client-secret',
							tokenEndpoint: 'https://auth.stage.niedersachsen-login.schule/realms/SANIS/protocol/openid-connect/token',
							grantType: 'authorization_code',
							scope: 'openid',
							responseType: 'code',
							redirectUri: '',
							authEndpoint: 'https://auth.stage.niedersachsen-login.schule/realms/SANIS/protocol/openid-connect/auth',
							provider: 'moin.schule',
							jwksEndpoint: 'https://auth.stage.niedersachsen-login.schule/realms/SANIS/protocol/openid-connect/certs',
							issuer: 'https://auth.stage.niedersachsen-login.schule/realms/SANIS',
							endSessionEndpoint:
								'https://auth.stage.niedersachsen-login.schule/realms/SANIS/protocol/openid-connect/logout',
						}),
					})
				);
			});

			it('should return 1', async () => {
				setup();

				const result = await service.import();

				expect(result).toEqual(1);
			});
		});

		describe('when the environment is not nbc and sanis client id and secret are not defined', () => {
			const setup = () => {
				config.scTheme = SchulcloudTheme.BRANDENBURG;
				config.schulconnexClientId = undefined;
				config.schulconnexClientSecret = undefined;
				config.brandenburgClientId = undefined;
				config.brandenburgClientSecret = undefined;
			};

			it('should not import sanis', async () => {
				setup();

				await service.import();

				expect(systemService.save).not.toHaveBeenCalled();
			});

			it('should return 0', async () => {
				setup();

				const result = await service.import();

				expect(result).toEqual(0);
			});
		});

		describe('when the environment is brb and Brandenburg client id and secret are defined', () => {
			const setup = () => {
				config.scTheme = SchulcloudTheme.BRANDENBURG;
				config.schulconnexClientId = undefined;
				config.schulconnexClientSecret = undefined;
				config.brandenburgClientId = 'brandenburg-client-id';
				config.brandenburgClientSecret = 'brandenburg-client-secret';
				config.brandenburgAuthEndpoint =
					'https://idp.example-brandenburg.test/realms/schullogin/protocol/openid-connect/auth';
				config.brandenburgTokenEndpoint =
					'https://idp.example-brandenburg.test/realms/schullogin/protocol/openid-connect/token';
				config.brandenburgJwksEndpoint =
					'https://idp.example-brandenburg.test/realms/schullogin/protocol/openid-connect/certs';
				config.brandenburgIssuer = 'https://idp.example-brandenburg.test/realms/schullogin';
				config.brandenburgEndSessionEndpoint =
					'https://idp.example-brandenburg.test/realms/schullogin/protocol/openid-connect/logout';
				config.brandenburgProvisioningUrl = 'https://idp.example-brandenburg.test/schulconnect/v1/person-info';
				encryptionService.encrypt.mockReturnValueOnce('encrypted-brandenburg-secret');
			};

			it('should encrypt the secret', async () => {
				setup();

				await service.import();

				expect(encryptionService.encrypt).toHaveBeenCalledWith('brandenburg-client-secret');
			});

			it('should import Brandenburg', async () => {
				setup();

				await service.import();

				expect(systemService.save).toHaveBeenCalledWith<[System]>(
					new System({
						id: '5cf5a54f067252f954f47bba',
						alias: 'Brandenburg',
						displayName: 'Brandenburg',
						type: 'oauth',
						provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC,
						provisioningUrl: 'https://idp.example-brandenburg.test/schulconnect/v1/person-info',
						oauthConfig: new OauthConfig({
							clientId: 'brandenburg-client-id',
							clientSecret: 'encrypted-brandenburg-secret',
							tokenEndpoint: 'https://idp.example-brandenburg.test/realms/schullogin/protocol/openid-connect/token',
							grantType: 'authorization_code',
							scope: 'openid',
							responseType: 'code',
							redirectUri: '',
							authEndpoint: 'https://idp.example-brandenburg.test/realms/schullogin/protocol/openid-connect/auth',
							provider: 'Brandenburg',
							jwksEndpoint: 'https://idp.example-brandenburg.test/realms/schullogin/protocol/openid-connect/certs',
							issuer: 'https://idp.example-brandenburg.test/realms/schullogin',
							endSessionEndpoint: 'https://idp.example-brandenburg.test/realms/schullogin/protocol/openid-connect/logout',
						}),
					})
				);
			});

			it('should return 1', async () => {
				setup();

				const result = await service.import();

				expect(result).toEqual(1);
			});
		});

		describe('when the environment is not brb even though Brandenburg client id, secret and all endpoints are defined', () => {
			const setup = () => {
				config.scTheme = SchulcloudTheme.DEFAULT;
				config.schulconnexClientId = undefined;
				config.schulconnexClientSecret = undefined;
				config.brandenburgClientId = 'brandenburg-client-id';
				config.brandenburgClientSecret = 'brandenburg-client-secret';
				config.brandenburgAuthEndpoint =
					'https://idp.example-brandenburg.test/realms/schullogin/protocol/openid-connect/auth';
				config.brandenburgTokenEndpoint =
					'https://idp.example-brandenburg.test/realms/schullogin/protocol/openid-connect/token';
				config.brandenburgJwksEndpoint =
					'https://idp.example-brandenburg.test/realms/schullogin/protocol/openid-connect/certs';
				config.brandenburgIssuer = 'https://idp.example-brandenburg.test/realms/schullogin';
				config.brandenburgEndSessionEndpoint =
					'https://idp.example-brandenburg.test/realms/schullogin/protocol/openid-connect/logout';
				config.brandenburgProvisioningUrl = 'https://idp.example-brandenburg.test/schulconnect/v1/person-info';
			};

			it('should not import Brandenburg', async () => {
				setup();

				const result = await service.import();

				expect(systemService.save).not.toHaveBeenCalled();
				expect(result).toEqual(0);
			});
		});

		describe('when the environment is brb but Brandenburg client id/secret are defined and an endpoint URL is missing', () => {
			const setup = () => {
				config.scTheme = SchulcloudTheme.BRANDENBURG;
				config.schulconnexClientId = undefined;
				config.schulconnexClientSecret = undefined;
				config.brandenburgClientId = 'brandenburg-client-id';
				config.brandenburgClientSecret = 'brandenburg-client-secret';
				config.brandenburgAuthEndpoint =
					'https://idp.example-brandenburg.test/realms/schullogin/protocol/openid-connect/auth';
				config.brandenburgTokenEndpoint =
					'https://idp.example-brandenburg.test/realms/schullogin/protocol/openid-connect/token';
				config.brandenburgJwksEndpoint =
					'https://idp.example-brandenburg.test/realms/schullogin/protocol/openid-connect/certs';
				config.brandenburgIssuer = 'https://idp.example-brandenburg.test/realms/schullogin';
				config.brandenburgEndSessionEndpoint = undefined;
				config.brandenburgProvisioningUrl = 'https://idp.example-brandenburg.test/schulconnect/v1/person-info';
			};

			it('should not import Brandenburg', async () => {
				setup();

				const result = await service.import();

				expect(systemService.save).not.toHaveBeenCalled();
				expect(result).toEqual(0);
			});
		});

		describe('when both moin.schule and Brandenburg credentials are configured but the environment is n21', () => {
			const setup = () => {
				config.scTheme = SchulcloudTheme.NIEDERSACHSEN;
				config.schulconnexClientId = 'client-id';
				config.schulconnexClientSecret = 'client-secret';
				config.brandenburgClientId = 'brandenburg-client-id';
				config.brandenburgClientSecret = 'brandenburg-client-secret';
				config.brandenburgAuthEndpoint =
					'https://idp.example-brandenburg.test/realms/schullogin/protocol/openid-connect/auth';
				config.brandenburgTokenEndpoint =
					'https://idp.example-brandenburg.test/realms/schullogin/protocol/openid-connect/token';
				config.brandenburgJwksEndpoint =
					'https://idp.example-brandenburg.test/realms/schullogin/protocol/openid-connect/certs';
				config.brandenburgIssuer = 'https://idp.example-brandenburg.test/realms/schullogin';
				config.brandenburgEndSessionEndpoint =
					'https://idp.example-brandenburg.test/realms/schullogin/protocol/openid-connect/logout';
				config.brandenburgProvisioningUrl = 'https://idp.example-brandenburg.test/schulconnect/v1/person-info';
				encryptionService.encrypt.mockReturnValueOnce('encrypted-client-secret');
			};

			it('should only import moin.schule, not Brandenburg, since only one theme is active at a time', async () => {
				setup();

				const result = await service.import();

				expect(systemService.save).toHaveBeenCalledTimes(1);
				expect(result).toEqual(1);
			});
		});
	});
});
