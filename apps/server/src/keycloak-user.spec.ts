/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { readFile } from 'fs/promises';

describe('KeycloakUserDataCheck', () => {
	let accounts: any;
	let users: any;
	let kcUsers: any;

	beforeAll(async () => {
		accounts = JSON.parse(await readFile('./backup/setup/accounts.json', 'utf-8'));
		users = JSON.parse(await readFile('./backup/setup/users.json', 'utf-8'));
		kcUsers = JSON.parse(await readFile('./backup/keycloak/dBildungscloud-users-0.json', 'utf-8'));
	});

	it('Accounts exists', () => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		kcUsers.users
			.filter((kcUser) => kcUser.username !== 'dbildungscloud') // excludes the realm admin
			.forEach((kcUser) => {
				const account = accounts.find((currentAccount) => kcUser.email === currentAccount.username);
				expect(account).toBeDefined();
			});
	});

	it('Users exists', () => {
		kcUsers.users
			.filter((kcUser) => kcUser.username !== 'dbildungscloud') // excludes the realm admin
			.forEach((kcUser) => {
				const user = users.find((currentUser) => kcUser.email === currentUser.email);
				expect(user).toBeDefined();
				expect(user?.firstName).toBe(kcUser.firstName);
				expect(user?.lastName).toBe(kcUser.lastName);
			});
	});
});
