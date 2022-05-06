import { Test, TestingModule } from '@nestjs/testing';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { IdentityManagementConsole } from '@src/console/identity-management.console';
import { IKeycloakSettings, KeycloakSettings } from '@shared/infra/identity-management/keycloak';
import { ConsoleWriterService } from '@shared/infra/console';
import { v1 } from 'uuid';

describe('IdentityManagementConsole', () => {
	let module: TestingModule;
	let console: IdentityManagementConsole;
	let writer: ConsoleWriterService;
	let client: KeycloakAdminClient;
	let settings: IKeycloakSettings;

	const getSettings = (): IKeycloakSettings => {
		return {
			baseUrl: 'http://localhost:8080',
			realmName: 'master',
			credentials: {
				username: 'username',
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
				{
					provide: ConsoleWriterService,
					useValue: {
						info: jest.fn(),
					},
				},
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
		writer = module.get(ConsoleWriterService);
		client = module.get(KeycloakAdminClient);
		settings = module.get(KeycloakSettings);
		console = new IdentityManagementConsole(writer, client, settings);
	});

	beforeEach(() => {
		settings = getSettings();
	});

	it('check', async () => {
		await expect(console.check()).resolves.not.toThrow();
	});
	it('check should fail', async () => {
		settings.credentials.username = '';
		await expect(console.check()).rejects.toThrow();
	});
	it('clean', async () => {
		await expect(console.clean()).resolves.not.toThrow();
	});
	it('seed', async () => {
		await expect(console.seed()).resolves.not.toThrow();
	});
});
