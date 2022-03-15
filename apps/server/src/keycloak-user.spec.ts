/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import accounts from '../../../backup/setup/accounts.json';
import users from '../../../backup/setup/users.json';
import kcUsers from '../../../backup/keycloak/dBildungscloud-users-0.json';

describe('KeycloakUserDataCheck', () => {
	it('Accounts exists', () => {
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
