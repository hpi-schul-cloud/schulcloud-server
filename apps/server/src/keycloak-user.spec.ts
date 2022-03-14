import accounts from '../../../backup/setup/accounts.json';
import users from '../../../backup/setup/users.json';
import kcUsers from '../../../backup/keycloak/dBildungscloud-users-0.json';

describe('KeycloakUserDataCheck', () => {
  it('Accounts exists', () => {
    kcUsers.users
      .filter(kcUser => kcUser.username !== 'dbildungscloud') // excludes the realm admin
      .map(kcUser => {
        const account = accounts.find(account => kcUser.email === account.username);
        expect(account).toBeDefined();
    })
  })

  it('Users exists', () => {
    kcUsers.users
      .filter(kcUser => kcUser.username !== 'dbildungscloud') // excludes the realm admin
      .map(kcUser => {
        const user = users.find(user => kcUser.email === user.email);
        expect(user).toBeDefined();
        expect(user?.firstName).toBe(kcUser.firstName);
        expect(user?.lastName).toBe(kcUser.lastName);
    });
  })
})
