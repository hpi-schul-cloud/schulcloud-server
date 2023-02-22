import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakAdministrationService } from '../service/keycloak-administration.service';
import { KeycloakConfigurationService } from '../service/keycloak-configuration.service';
import { KeycloakSeedService } from '../../keycloak-configuration/service/keycloak-seed.service';
import { KeycloakConfigurationUc } from './keycloak-configuration.uc';

describe('KeycloakManagementUc', () => {
	let module: TestingModule;
	let uc: KeycloakConfigurationUc;
	let keycloakAdminServiceMock: DeepMocked<KeycloakAdministrationService>;
	let keycloakConfigServiceMock: DeepMocked<KeycloakConfigurationService>;
	let keycloakSeedServiceMock: DeepMocked<KeycloakSeedService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				KeycloakConfigurationUc,
				{
					provide: KeycloakAdministrationService,
					useValue: createMock<KeycloakAdministrationService>(),
				},
				{
					provide: KeycloakConfigurationService,
					useValue: createMock<KeycloakConfigurationService>(),
				},
				{
					provide: KeycloakSeedService,
					useValue: createMock<KeycloakSeedService>(),
				},
			],
		}).compile();
		uc = module.get(KeycloakConfigurationUc);
		keycloakAdminServiceMock = module.get(KeycloakAdministrationService);
		keycloakConfigServiceMock = module.get(KeycloakConfigurationService);
		keycloakSeedServiceMock = module.get(KeycloakSeedService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('check', () => {
		it('should return connection status', async () => {
			keycloakAdminServiceMock.testKcConnection.mockResolvedValueOnce(true);

			await expect(uc.check()).resolves.toBe(true);

			keycloakAdminServiceMock.testKcConnection.mockResolvedValueOnce(false);

			await expect(uc.check()).resolves.toBe(false);
		});
	});

	describe('clean', () => {
		it('should call service', async () => {
			keycloakSeedServiceMock.clean.mockResolvedValueOnce(4);

			const numberOfCleanedUsers = await uc.clean();
			expect(keycloakSeedServiceMock.clean).toBeCalledTimes(1);
			expect(numberOfCleanedUsers).toBe(4);
		});
	});

	describe('seed', () => {
		it('should call service', async () => {
			keycloakSeedServiceMock.seed.mockResolvedValueOnce(5);

			const numberOfSeeds = await uc.seed();
			expect(keycloakSeedServiceMock.seed).toBeCalledTimes(1);
			expect(numberOfSeeds).toBe(5);
		});
	});

	describe('configure', () => {
		it('should call services', async () => {
			await uc.configure();
			expect(keycloakConfigServiceMock.configureClient).toBeCalledTimes(1);
			expect(keycloakConfigServiceMock.configureBrokerFlows).toBeCalledTimes(1);
			expect(keycloakConfigServiceMock.configureIdentityProviders).toBeCalledTimes(1);
			expect(keycloakConfigServiceMock.configureRealm).toBeCalledTimes(1);
			expect(keycloakAdminServiceMock.setPasswordPolicy).toBeCalledTimes(1);
		});
	});
});
