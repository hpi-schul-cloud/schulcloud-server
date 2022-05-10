import { Test, TestingModule } from '@nestjs/testing';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { v1 } from 'uuid';
import { IKeycloakSettings, KeycloakSettings } from '../interface/keycloak-settings.interface';
import { KeycloakManagementUc } from './Keycloak-management.uc';
import { KeycloakAdministrationService } from '../keycloak-administration.service';

describe('KeycloakManagementUc', () => {
	let module: TestingModule;
	let uc: KeycloakManagementUc;
	let client: KeycloakAdminClient;
	let settings: IKeycloakSettings;

	// TODO check logic

	const adminUsername = 'admin';

	const getSettings = (): IKeycloakSettings => {
		return {
			baseUrl: 'http://localhost:8080',
			realmName: 'master',
			clientId: 'dBildungscloud',
			credentials: {
				username: adminUsername,
				password: 'password',
				grantType: 'password',
				clientId: 'client-id',
			},
		};
	};
	const users: UserRepresentation[] = [
		{
			id: v1(),
			firstName: 'John',
			lastName: 'Doe',
			email: 'john.doe@email.tld',
		},
		{
			id: v1(),
			firstName: 'Jane',
			lastName: 'Doe',
			email: 'jane.doe@email.tld',
		},
	];

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				KeycloakManagementUc,
				{
					provide: KeycloakAdministrationService,
					useValue: {
						callKcAdminClient: jest.fn().mockImplementation(async (): Promise<KeycloakAdminClient> => {
							return Promise.resolve(client);
						}),
						testKcConnection: jest.fn().mockResolvedValue(true),
						getAdminUser: jest.fn().mockResolvedValue(adminUsername),
					},
				},
				{
					provide: KeycloakAdminClient,
					useValue: {
						auth: jest.fn().mockImplementation(async (): Promise<void> => {
							if (settings.credentials.username !== adminUsername) {
								throw new Error();
							}

							return Promise.resolve();
						}),
						setConfig: jest.fn(),
						users: {
							create: jest.fn(),
							del: jest.fn(),
							find: jest.fn().mockImplementation((): Promise<UserRepresentation[]> => Promise.resolve(users)),
						},
					},
				},
				{
					provide: KeycloakSettings,
					useFactory: getSettings,
				},
			],
		}).compile();
		uc = module.get(KeycloakManagementUc);
		client = module.get(KeycloakAdminClient);
		settings = module.get(KeycloakSettings);
	});

	describe('check', () => {
		it('should return true', async () => {
			await expect(uc.check()).resolves.toBe(true);
		});
	});

	describe('clean', () => {
		it('should clean successfully', async () => {
			await expect(uc.clean()).resolves.not.toThrow();
		});
	});

	describe('seed', () => {
		it('should clean successfully', async () => {
			await expect(uc.seed()).resolves.not.toThrow();
		});
	});
});
