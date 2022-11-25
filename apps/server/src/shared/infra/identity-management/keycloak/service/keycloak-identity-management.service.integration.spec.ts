import { Configuration } from '@hpi-schul-cloud/commons/lib';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { Test, TestingModule } from '@nestjs/testing';
import { IdentityManagementService } from '../../identity-management.service';
import { KeycloakSettings } from '../interface/keycloak-settings.interface';
import { KeycloakIdentityManagementService } from './keycloak-identity-management.service';

/**
 * This test does not run on CI!
 *
 * This test can be used to verify that schulcloud-server and Keycloak (ErWIn-IDM)
 * communication is working OK in the local developers environment.
 *
 * Once Keycloak is integrated into the CI setup, this test can be re-factored and enabled.
 *
 */
describe.skip('KeycloakIdentityManagement', () => {
	let module: TestingModule;
	let idm: IdentityManagementService;

	// This is the GIVEN data of the integration test.
	// TODO This MUST to be replaced by a proper data seeding (GitHub Action?) to be running in the CI
	const account1 = { userName: 'user-1', email: 'test1@test.test' };
	const account1Password = 'testPasswd1';

	const account2 = { userName: 'user-2', email: 'test2@test.test', firstName: 'first', lastName: 'last' };
	const account2Password = 'testPasswd2';

	let account1Id: string | null;
	let account2Id: string | null;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{ provide: IdentityManagementService, useClass: KeycloakIdentityManagementService },
				{ provide: KeycloakAdminClient, useClass: KeycloakAdminClient },
				{
					provide: KeycloakSettings,
					useValue: {
						baseUrl: Configuration.get('IDENTITY_MANAGEMENT__URI') as string,
						realmName: Configuration.get('IDENTITY_MANAGEMENT__TENANT') as string,
						clientId: Configuration.get('IDENTITY_MANAGEMENT__CLIENTID') as string,
						credentials: {
							grantType: 'password',
							username: Configuration.get('IDENTITY_MANAGEMENT__ADMIN_USER') as string,
							password: Configuration.get('IDENTITY_MANAGEMENT__ADMIN_PASSWORD') as string,
							clientId: Configuration.get('IDENTITY_MANAGEMENT__ADMIN_CLIENTID') as string,
						},
					},
				},
			],
		}).compile();
		idm = module.get(IdentityManagementService);

		// This sets the GIVEN part of the integration test.
		// TODO To be used in the CI, this MUST to be replaced by a proper data seeding (GitHub Action?)
		account1Id = await idm.createAccount(account1);
		expect(account1Id).not.toBeNull();
		account2Id = await idm.createAccount(account2, account2Password);
		expect(account2Id).not.toBeNull();
	});

	// This cleans up the integration test data.
	// TODO To be used in the CI, this MUST to be handled by the data seeding beforehand (see #beforeAll)
	afterAll(async () => {
		// CLEANUP delete accounts
		let ret: string | null;
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		ret = await idm.deleteAccountById(account1Id!);
		expect(ret).not.toBeNull();
		expect(ret).toEqual(account1Id);
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		ret = await idm.deleteAccountById(account2Id!);
		expect(ret).not.toBeNull();
		expect(ret).toEqual(account2Id);
		await module.close();
	});

	// This is a user journey for local testing only
	// TODO This journey SHOULD be separate into acceptance tests steps, once re-factored to be running in the CI or E2E.
	it('should allow to find and modify accounts.', async () => {
		const foundAccounts = await idm.getAllAccounts();
		expect(foundAccounts).toContainEqual(expect.objectContaining(account1));
		expect(foundAccounts).toContainEqual(expect.objectContaining(account2));

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let foundAccount = await idm.findAccountById(account1Id!);
		expect(foundAccount).toEqual(expect.objectContaining(account1));

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const foundAccount2 = await idm.findAccountById(account2Id!);
		expect(foundAccount2).toEqual(expect.objectContaining(account2));

		// WHEN account is updated
		account2.firstName = 'newFirst';
		account2.lastName = 'newLast';
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		account2Id = await idm.updateAccount(account2Id!, account2);
		expect(account2Id).not.toBeNull();
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		foundAccount = await idm.findAccountById(account2Id);
		expect(foundAccount).toEqual(expect.objectContaining(account2));

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const updatePwdAccount1Ret = await idm.updateAccountPassword(account1Id!, account1Password);
		expect(updatePwdAccount1Ret).not.toBeNull();
		expect(updatePwdAccount1Ret).toEqual(account1Id);
	});
});

/*
describe('KeycloakIdentityManagementService', () => {
	let module: TestingModule;
	let idmService: IdentityManagementService;
	let keycloakService: KeycloakAdministrationService;

	const testRealm = 'test-realm';

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [KeycloakModule],
		}).compile();
		idmService = module.get(IdentityManagementService);
		keycloakService = module.get(KeycloakAdministrationService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(async () => {
		const kc = await keycloakService.callKcAdminClient();
		kc.realms.create({ realm: })
	});
});
*/
