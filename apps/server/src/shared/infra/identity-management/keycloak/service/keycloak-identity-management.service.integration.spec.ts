import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakAdministrationService } from '@shared/infra/identity-management/keycloak/service/keycloak-administration.service';
import { IAccount } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { KeycloakIdentityManagementService } from './keycloak-identity-management.service';
import { IKeycloakSettings, KeycloakSettings } from '../interface/keycloak-settings.interface';
import { IdentityManagementService } from '../../identity-management.service';

describe('KeycloakIdentityManagementService', () => {
	let module: TestingModule;
	let idmService: KeycloakIdentityManagementService;
	let keycloakAdminService: KeycloakAdministrationService;
	let keycloak: KeycloakAdminClient;
	let isKeycloakReachable = false;

	const testRealm = 'test-realm';
	const testAccount: IAccount = {
		id: new ObjectId().toString(),
		email: 'john.doe@mail.tld',
		username: 'john.doe@mail.tld',
		firstName: 'John',
		lastName: 'Doe',
	};
	const createAccount = async (): Promise<string> => {
		const { id } = await keycloak.users.create({
			username: testAccount.username,
			firstName: testAccount.firstName,
			lastName: testAccount.lastName,
			attributes: {
				mongoId: testAccount.id,
			},
		});
		return id;
	};
	const listAccounts = async (): Promise<UserRepresentation[]> => {
		return keycloak.users.find();
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				KeycloakAdministrationService,
				{ provide: IdentityManagementService, useClass: KeycloakIdentityManagementService },
				{
					provide: KeycloakAdminClient,
					useValue: new KeycloakAdminClient(),
				},
				{
					provide: KeycloakSettings,
					useValue: {
						clientId: 'admin-cli',
						baseUrl: 'http://localhost:8080',
						realmName: 'master',
						credentials: {
							clientId: 'admin-cli',
							username: 'keycloak',
							password: 'keycloak',
							grantType: 'password',
						},
					} as IKeycloakSettings,
				},
			],
		}).compile();
		idmService = module.get(IdentityManagementService);
		keycloakAdminService = module.get(KeycloakAdministrationService);
		isKeycloakReachable = await keycloakAdminService.testKcConnection();
		if (isKeycloakReachable) {
			keycloak = await keycloakAdminService.callKcAdminClient();
		}
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(async () => {
		if (isKeycloakReachable) {
			await keycloak.realms.create({ realm: testRealm, editUsernameAllowed: true });
			keycloak.setConfig({ realmName: testRealm });
		}
	});

	afterEach(async () => {
		if (isKeycloakReachable) {
			await keycloak.realms.del({ realm: testRealm });
		}
	});

	it('should create an account', async () => {
		if (!isKeycloakReachable) return;

		const id = await idmService.createAccount(testAccount);
		const accounts = await listAccounts();

		expect(id).toBeDefined();
		expect(accounts).toEqual(
			expect.arrayContaining([
				expect.objectContaining<UserRepresentation>({
					username: testAccount.username,
					firstName: testAccount.firstName,
					lastName: testAccount.lastName,
					attributes: {
						mongoId: [testAccount.id],
					},
				}),
			])
		);
	});

	it('should update an account', async () => {
		if (!isKeycloakReachable) return;

		const newAccount: IAccount = {
			email: 'jane.doe@mail.tld',
			username: 'jane.doe@mail.tld',
			firstName: 'Jane',
			lastName: 'Doe',
		};
		const id = await createAccount();
		const result = await idmService.updateAccount(id, newAccount);
		const accounts = await listAccounts();

		expect(result).toEqual(id);
		expect(accounts).toEqual(
			expect.arrayContaining([
				expect.objectContaining<UserRepresentation>({
					email: newAccount.email,
					username: newAccount.username,
					firstName: newAccount.firstName,
					lastName: newAccount.lastName,
				}),
			])
		);
		expect(accounts).not.toEqual(
			expect.arrayContaining([
				expect.objectContaining<UserRepresentation>({
					username: testAccount.username,
					firstName: testAccount.firstName,
					lastName: testAccount.lastName,
				}),
			])
		);
	});

	it('should update password of an account', async () => {
		if (!isKeycloakReachable) return;

		await createAccount();
		const result = await idmService.updateAccountPassword(testAccount.id as string, 'new-password');

		expect(result).toEqual(testAccount.id);
	});

	it('should find an account by id', async () => {
		if (!isKeycloakReachable) return;

		await createAccount();
		const account = await idmService.findAccountById(testAccount.id as string);

		expect(account).toEqual(
			expect.objectContaining<IAccount>({
				username: testAccount.username,
				firstName: testAccount.firstName,
				lastName: testAccount.lastName,
			})
		);
	});

	it('should find an account by username', async () => {
		if (!isKeycloakReachable) return;

		await createAccount();
		const account = await idmService.findAccountByUsername(testAccount.username as string);

		expect(account).toEqual(
			expect.objectContaining<IAccount>({
				username: testAccount.username,
				firstName: testAccount.firstName,
				lastName: testAccount.lastName,
			})
		);
	});

	it('should list all accounts', async () => {
		if (!isKeycloakReachable) return;

		await createAccount();
		const accounts = await idmService.getAllAccounts();

		expect(accounts).toHaveLength(1);
	});

	it('should delete an account', async () => {
		if (!isKeycloakReachable) return;

		await createAccount();
		const result = await idmService.deleteAccountById(testAccount.id as string);
		const accounts = await listAccounts();

		expect(result).toEqual(testAccount.id);
		expect(accounts).toHaveLength(0);
	});
});
