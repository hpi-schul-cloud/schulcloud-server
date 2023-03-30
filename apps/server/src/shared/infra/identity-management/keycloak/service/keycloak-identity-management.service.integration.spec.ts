import KeycloakAdminClient from '@keycloak/keycloak-admin-client-cjs/keycloak-admin-client-cjs-index.js';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { ObjectId } from '@mikro-orm/mongodb';
import { HttpModule } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { IAccount, IAccountUpdate } from '@shared/domain';
import { KeycloakAdministrationService } from '@shared/infra/identity-management/keycloak-administration/service/keycloak-administration.service';
import { KeycloakModule } from '@shared/infra/identity-management/keycloak/keycloak.module';
import { ServerModule } from '@src/modules/server';
import { v1 } from 'uuid';
import { IdentityManagementService } from '../../identity-management.service';
import { KeycloakIdentityManagementService } from './keycloak-identity-management.service';

describe('KeycloakIdentityManagementService Integration', () => {
	let module: TestingModule;
	let idmService: KeycloakIdentityManagementService;
	let keycloakAdminService: KeycloakAdministrationService;
	let keycloak: KeycloakAdminClient;
	let isKeycloakReachable: boolean;

	const testRealm = `test-realm-${v1().toString()}`;
	const testAccount: IAccount = {
		id: new ObjectId().toString(),
		email: 'john.doe@mail.tld',
		username: 'john.doe@mail.tld',
		firstName: 'John',
		lastName: 'Doe',
		attRefTechnicalId: new ObjectId().toString(),
	};
	const createAccount = async (attributeName?: string, attributeValue?: unknown): Promise<string> => {
		const { id } = await keycloak.users.create({
			username: testAccount.username,
			firstName: testAccount.firstName,
			lastName: testAccount.lastName,
			attributes: {
				refTechnicalId: testAccount.attRefTechnicalId,
				refFunctionalIntId: undefined,
				refFunctionalExtId: undefined,
				attributeName: attributeValue,
			},
		});
		return id;
	};
	const listAccounts = async (): Promise<UserRepresentation[]> => keycloak.users.find();

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [KeycloakModule, ServerModule, HttpModule],
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
						refTechnicalId: [testAccount.attRefTechnicalId],
					},
				}),
			])
		);
	});

	it('should update an account', async () => {
		if (!isKeycloakReachable) return;
		const newAccount: IAccountUpdate = {
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
		const idmId = await createAccount();
		const result = await idmService.updateAccountPassword(idmId, 'new-password');

		expect(result).toEqual(idmId);
	});

	it('should find an account by id', async () => {
		if (!isKeycloakReachable) return;
		const idmId = await createAccount();
		const account = await idmService.findAccountById(idmId);

		expect(account).toEqual(
			expect.objectContaining<IAccount>({
				id: idmId,
				username: testAccount.username,
				firstName: testAccount.firstName,
				lastName: testAccount.lastName,
			})
		);
	});

	it('should find an account by username', async () => {
		if (!isKeycloakReachable) return;
		await createAccount();
		const [account] = await idmService.findAccountsByUsername(testAccount.username as string);

		expect(account).toEqual(
			expect.arrayContaining([
				expect.objectContaining<Omit<IAccount, 'id'>>({
					username: testAccount.username,
					firstName: testAccount.firstName,
					lastName: testAccount.lastName,
				}),
			])
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
		const idmId = await createAccount();
		const result = await idmService.deleteAccountById(idmId);
		const accounts = await listAccounts();

		expect(result).toEqual(idmId);
		expect(accounts).toHaveLength(0);
	});

	describe('getUserAttributes', () => {
		describe('when keycloak is reachable and user exists', () => {
			const setup = async () => {
				const attributeName = 'attributeName';
				const attributeValue = 'attributeValue';
				const idmId = await createAccount(attributeName, attributeValue);
				return { idmId, attributeName, attributeValue };
			};

			it('should return the attribute value', async () => {
				if (!isKeycloakReachable) return;
				const { idmId, attributeName, attributeValue } = await setup();
				const result = await idmService.getUserAttribute(idmId, attributeName);

				expect(result).toEqual(attributeValue);
			});
		});
	});

	describe('setUserAttribute', () => {
		describe('when keycloak is reachable and user exists', () => {
			const setup = async () => {
				const attributeName = 'attributeName';
				const attributeValue = 'attributeValue';
				const idmId = await createAccount();
				return { idmId, attributeName, attributeValue };
			};

			it('should set the attribute value', async () => {
				if (!isKeycloakReachable) return;
				const { idmId, attributeName, attributeValue } = await setup();
				await idmService.setUserAttribute(idmId, attributeName, attributeValue);
				const result = await idmService.getUserAttribute(idmId, attributeName);

				expect(result).toEqual(attributeValue);
			});
		});
	});
});
