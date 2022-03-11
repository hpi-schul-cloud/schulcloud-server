import accounts from '../../../backup/setup/accounts.json';
import users from '../../../backup/setup/users.json';
import kcUsers from '../../../backup/keycloak/dBildunscloud-users-0.json';

describe('KeycloakUserDataCheck', () => {
  it('Accounts exists', () => {
    kcUsers.users.map(kcUser => {
      const account = accounts.find(account => kcUser.email === account.username);
      expect(account).toBeDefined();
    })
  })

  it('Users exists', () => {
    kcUsers.users.map(kcUser => {
      const user = users.find(user => kcUser.email === user.email);
      expect(user).toBeDefined();
      expect(user?.firstName).toBe(kcUser.firstName);
      expect(user?.lastName).toBe(kcUser.lastName);
    });
  })
})
