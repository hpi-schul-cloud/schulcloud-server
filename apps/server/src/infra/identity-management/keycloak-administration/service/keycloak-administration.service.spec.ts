import { createMock, DeepMocked } from '@golevelup/ts-jest';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client-cjs/keycloak-admin-client-cjs-index';
import { Clients } from '@keycloak/keycloak-admin-client/lib/resources/clients';
import { Test, TestingModule } from '@nestjs/testing';
import { IKeycloakSettings, KeycloakSettings } from '../interface/keycloak-settings.interface';
import { KeycloakAdministrationService } from './keycloak-administration.service';

describe('KeycloakAdministrationService', () => {
	let module: TestingModule;
	let kcAdminClient: DeepMocked<KeycloakAdminClient>;
	let settings: IKeycloakSettings;
	let service: KeycloakAdministrationService;

	const kcApiClientMock = createMock<Clients>();

	const getSettings = (): IKeycloakSettings => {
		return {
			internalBaseUrl: 'http://localhost:8080',
			externalBaseUrl: 'http://localhost:8080',
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

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				KeycloakAdministrationService,
				{
					provide: KeycloakAdminClient,
					useValue: createMock<KeycloakAdminClient>(),
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

		kcAdminClient.realms.update = jest.fn();
		kcAdminClient.clients = kcApiClientMock;
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		service.resetLastAuthorizationTime();
		kcApiClientMock.find.mockClear();
		jest.resetAllMocks();
	});

	describe('callKcAdminClient', () => {
		it('should return the original client', async () => {
			const ret = await service.callKcAdminClient();
			expect(ret).toBe(kcAdminClient);
		});

		it('should authorize before client access', async () => {
			await service.callKcAdminClient();
			expect(kcAdminClient.auth).toHaveBeenCalled();
		});

		it('should authorize only once per minute', async () => {
			jest.useFakeTimers();

			// set timer
			jest.setSystemTime(new Date(2020, 1, 1, 0, 0, 0));
			await service.callKcAdminClient();
			kcAdminClient.auth.mockClear();

			await service.callKcAdminClient();
			expect(kcAdminClient.auth).not.toHaveBeenCalled();

			jest.setSystemTime(new Date(2020, 1, 1, 0, 1, 0));
			await service.callKcAdminClient();
			expect(kcAdminClient.auth).toHaveBeenCalled();

			jest.useRealTimers();
		});
	});

	describe('testKcConnection', () => {
		it('should return true on success', async () => {
			expect(await service.testKcConnection()).toBe(true);
		});

		it('should return false on error', async () => {
			kcAdminClient.auth.mockRejectedValueOnce(new Error());
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
			expect(wellKnownUrl).toContain(settings.internalBaseUrl);
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
