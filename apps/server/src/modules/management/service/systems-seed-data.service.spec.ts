import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { OauthConfig, System, SystemService } from '@modules/system';
import { Test, TestingModule } from '@nestjs/testing';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { MANAGEMENT_SEED_DATA_CONFIG_TOKEN, ManagementSeedDataConfig } from '../management-seed-data.config';
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
				config.scTheme = 'n21';
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
				config.scTheme = 'brb';
				config.schulconnexClientId = undefined;
				config.schulconnexClientSecret = undefined;
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
	});
});
