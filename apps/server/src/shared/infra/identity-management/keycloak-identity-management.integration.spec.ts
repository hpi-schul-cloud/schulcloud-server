import { Test, TestingModule } from '@nestjs/testing';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { IIdentityManagement } from './identity-management.interface';
import { KeycloakIdentityManagement } from './keycloak-identity-management';

xdescribe('KeycloakIdentityManagement', () => {
	let idm: IIdentityManagement;

	// GIVEN
	const account1 = { userName: 'user-1', email: 'test1@test.test' };
	const account1Password = 'testPasswd1';

	const account2 = { userName: 'user-2', email: 'test2@test.test', firstName: 'first', lastName: 'last' };
	const account2Password = 'testPasswd2';

	let account1Id: string | null;
	let account2Id: string | null;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				{ provide: 'IdentityManagement', useClass: KeycloakIdentityManagement },
				{ provide: 'KeycloakAdminClient', useClass: KeycloakAdminClient },
				{
					provide: 'KeycloakSettings',
					useValue: {
						baseUrl: Configuration.get('IDENTITY_MANAGEMENT__URI') as string,
						realmName: Configuration.get('IDENTITY_MANAGEMENT__TENANT') as string,
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
		idm = module.get<IIdentityManagement>('IdentityManagement');

		// SETUP create accounts
		account1Id = await idm.createAccount(account1);
		expect(account1Id).not.toBeNull();
		account2Id = await idm.createAccount(account2, account2Password);
		expect(account2Id).not.toBeNull();
	});

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
	});

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
