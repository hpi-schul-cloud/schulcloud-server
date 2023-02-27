import { createMock } from '@golevelup/ts-jest';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { TestingModule, Test } from '@nestjs/testing';
import { Clients } from '@keycloak/keycloak-admin-client/lib/resources/clients';
import { IKeycloakSettings, KeycloakSettings } from '../interface/keycloak-settings.interface';
import { KeycloakAdministrationService } from './keycloak-administration.service';

describe('KeycloakAdministrationService', () => {
	let module: TestingModule;
	let kcAdminClient: KeycloakAdminClient;
	let settings: IKeycloakSettings;
	let service: KeycloakAdministrationService;

	const kcApiClientMock = createMock<Clients>();

	const getSettings = (): IKeycloakSettings => {
		return {
			baseUrl: 'http://localhost:8080',
			realmName: 'master',
			clientId: 'client',
			credentials: {
				username: 'username',
				password: 'password',
				grantType: 'password',
				clientId: 'client-id',
			},
		};
	};

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				KeycloakAdministrationService,
				{
					provide: KeycloakAdminClient,
					useValue: {
						auth: jest.fn().mockImplementation(async (): Promise<void> => {
							if (settings.credentials.username !== 'username') {
								throw new Error();
							}

							return Promise.resolve();
						}),
						setConfig: jest.fn(),
						realms: {
							update: jest.fn(),
						},
						clients: kcApiClientMock,
						baseUrl: getSettings().baseUrl,
						realmName: getSettings().realmName,
					},
				},
				{
					provide: KeycloakSettings,
					useFactory: getSettings,
				},
			],
		}).compile();

		kcAdminClient = module.get(KeycloakAdminClient);
		settings = module.get(KeycloakSettings);
		service = module.get(KeycloakAdministrationService);

		kcApiClientMock.find.mockClear();
	});

	describe('callKcAdminClient', () => {
		it('should return the original client', async () => {
			const ret = await service.callKcAdminClient();
			expect(ret).toBe(kcAdminClient);
		});

		it('should authorize before client access', async () => {
			const authSpy = jest.spyOn(kcAdminClient, 'auth');
			await service.callKcAdminClient();
			expect(authSpy).toHaveBeenCalled();
		});

		it('should authorize only once per minute', async () => {
			jest.useFakeTimers();
			const authSpy = jest.spyOn(kcAdminClient, 'auth');

			// set timer
			jest.setSystemTime(new Date(2020, 1, 1, 0, 0, 0));
			await service.callKcAdminClient();
			authSpy.mockClear();

			await service.callKcAdminClient();
			expect(authSpy).not.toHaveBeenCalled();

			jest.setSystemTime(new Date(2020, 1, 1, 0, 1, 0));
			await service.callKcAdminClient();
			expect(authSpy).toHaveBeenCalled();

			jest.useRealTimers();
		});
	});

	describe('testKcConnection', () => {
		it('should return true on success', async () => {
			expect(await service.testKcConnection()).toBe(true);
		});

		it('should return false on error', async () => {
			settings.credentials.username = '';
			expect(await service.testKcConnection()).toBe(false);
		});
	});

	describe('getAdminUser', () => {
		it('should return the admin username', () => {
			expect(service.getAdminUser()).toBe(settings.credentials.username);
		});
	});

	describe('getWellKnownUrl', () => {
		it('should return the well known URL', () => {
			const wellKnownUrl = service.getWellKnownUrl();
			expect(wellKnownUrl).toContain(settings.baseUrl);
			expect(wellKnownUrl).toContain(settings.realmName);
		});
	});

	describe('getClientId', () => {
		it('should return the client id', () => {
			expect(service.getClientId()).toBe(settings.clientId);
		});
	});

	describe('getClientSecret', () => {
		it('should return the clients secret', async () => {
			kcApiClientMock.find.mockResolvedValueOnce([{ id: 'internal_client_id' }]);
			kcApiClientMock.getClientSecret.mockResolvedValueOnce({ value: 'theSecret' });
			const secret = await service.getClientSecret();
			expect(secret).toBe('theSecret');
		});
		it('should return empty string if client could not be resolved', async () => {
			kcApiClientMock.find.mockResolvedValueOnce([]);
			kcApiClientMock.getClientSecret.mockResolvedValueOnce({ value: 'theSecret' });
			const secret = await service.getClientSecret();
			expect(secret).toBe('');
		});
	});

	describe('setPasswordPolicy', () => {
		it('should call the keycloak admin client with the correct params', async () => {
			await service.setPasswordPolicy();
			expect(kcAdminClient.realms.update).toBeCalledWith(
				{ realm: settings.realmName },
				{ passwordPolicy: 'hashIterations(310000)' }
			);
		});
		it('should authorize before configuration keycloak', async () => {
			await service.setPasswordPolicy();
			expect(kcAdminClient.auth).toHaveBeenCalledTimes(1);
		});
	});
});
