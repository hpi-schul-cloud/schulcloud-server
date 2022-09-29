/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { KeycloakAdministrationService } from '../service/keycloak-administration.service';
import { KeycloakManagementUc } from './Keycloak-management.uc';
import { KeycloakConfigurationService } from '../service/keycloak-configuration.service';
import { KeycloakSeedService } from '../service/keycloak-seed.service';

describe('KeycloakManagementUc', () => {
	let module: TestingModule;
	let uc: KeycloakManagementUc;
	const kcAdminClient = createMock<KeycloakAdminClient>();
	let keycloakAdministrationService: DeepMocked<KeycloakAdministrationService>;
	let keycloakConfigurationService: DeepMocked<KeycloakConfigurationService>;
	let keycloakSeedService: DeepMocked<KeycloakSeedService>;

	const adminUsername = 'admin';

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				KeycloakManagementUc,
				{
					provide: KeycloakAdministrationService,
					useValue: {
						callKcAdminClient: jest.fn().mockImplementation(async (): Promise<KeycloakAdminClient> => {
							return Promise.resolve(kcAdminClient);
						}),
						testKcConnection: jest.fn().mockResolvedValue(true),
						getAdminUser: jest.fn().mockReturnValue(adminUsername),
						setPasswordPolicy: jest.fn().mockResolvedValue(undefined),
					},
				},
				{
					provide: KeycloakConfigurationService,
					useValue: {
						configureClient: jest.fn().mockImplementation(async (): Promise<void> => {
							return Promise.resolve();
						}),
						configureIdentityProviders: jest.fn().mockImplementation(async (): Promise<number> => {
							return Promise.resolve(3);
						}),
						configureBrokerFlows: jest.fn().mockImplementation(async (): Promise<void> => {
							return Promise.resolve();
						}),
					},
				},
				{
					provide: KeycloakSeedService,
					useValue: {
						clean: jest.fn().mockImplementation(async (): Promise<number> => {
							return Promise.resolve(4);
						}),
						seed: jest.fn().mockImplementation(async (): Promise<number> => {
							return Promise.resolve(5);
						}),
					},
				},
			],
		}).compile();
		uc = module.get(KeycloakManagementUc);
		keycloakAdministrationService = module.get(KeycloakAdministrationService);
		keycloakConfigurationService = module.get(KeycloakConfigurationService);
		keycloakSeedService = module.get(KeycloakSeedService);
	});

	describe('check', () => {
		it('should return connection status', async () => {
			let expected = true;
			jest.spyOn(keycloakAdministrationService, 'testKcConnection').mockResolvedValue(expected);
			await expect(uc.check()).resolves.toBe(expected);

			expected = false;
			jest.spyOn(keycloakAdministrationService, 'testKcConnection').mockResolvedValue(expected);
			await expect(uc.check()).resolves.toBe(expected);
		});
	});

	describe('clean', () => {
		it('should call service', async () => {
			const numberOfCleanedUsers = await uc.clean();
			expect(keycloakSeedService.clean).toBeCalledTimes(1);
			expect(numberOfCleanedUsers).toBe(4);
		});
	});

	describe('seed', () => {
		it('should call service', async () => {
			const numberOfSeeds = await uc.seed();
			expect(keycloakSeedService.seed).toBeCalledTimes(1);
			expect(numberOfSeeds).toBe(5);
		});
	});
	describe('configure', () => {
		it('should call services', async () => {
			await uc.configure();
			expect(keycloakConfigurationService.configureClient).toBeCalledTimes(1);
			expect(keycloakConfigurationService.configureBrokerFlows).toBeCalledTimes(1);
			expect(keycloakConfigurationService.configureIdentityProviders).toBeCalledTimes(1);
			expect(keycloakAdministrationService.setPasswordPolicy).toBeCalledTimes(1);
		});
	});
});
