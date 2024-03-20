const { expect } = require('chai');
const sinon = require('sinon');

const appPromise = require('../../../../src/app');

const GeneralLDAPStrategy = require('../../../../src/services/ldap/strategies/general');

const mockLDAPConfig = {
	url: 'ldaps://ldap.dev:443',
	rootPath: 'o=bbs1',
	searchUser: 'cn=ldap-out,ou=administratoren,o=bbs1',
	providerOptions: {
		userPathAdditions: 'ou=SchuelerInnen;;ou=Lehrkraefte;;ou=Administratoren',
		classPathAdditions: 'ou=Klassen',
		roleType: 'text',
		userAttributeNameMapping: {
			givenName: 'givenName',
			sn: 'sn',
			uuid: 'cn',
			uid: 'uid',
			mail: 'mail',
			role: 'vCEtype',
			dn: 'dn',
		},
		roleAttributeNameMapping: {
			roleStudent: '431',
			roleTeacher: '411',
			roleAdmin: '421',
			roleNoSc: '',
		},
		classAttributeNameMapping: {
			description: 'fullName',
			uniqueMember: 'member',
			dn: 'dn',
		},
		schoolName: 'Berufsbildende Schulen 1 Göttingen - Arnoldi Schule',
	},
	provider: 'general',
	searchUserPassword: 'REMOVED',
	active: true,
};

describe('XGeneralLDAPStrategy', () => {
	let originalLdapService;
	let ldapServiceMock;

	let app;

	before(async () => {
		app = await appPromise();
		originalLdapService = app.service('ldap');
	});

	after(() => {
		app.unuse('/ldap');
		app.use('/ldap', originalLdapService);
	});

	describe('#getUsers', () => {
		function MockLdapService() {
			return {
				setup: () => {},
				get: () => {},
				searchCollection: sinon.fake.resolves([
					{
						dn: 'uid=max.mustermann.1,ou=users,o=school0,dc=de,dc=example,dc=org',
						givenName: 'Max',
						sn: 'Mustermann',
						uid: 'max.mustermann.1',
						uuid: 'ZDg0Y2ZlMjMtZGYwNi00MWNjLTg3YmUtZjI3NjA1NDJhY2Y0',
						mail: 'max.mustermann.1@example.org',
						vCEtype: '411',
					},
				]),
			};
		}

		beforeEach(() => {
			ldapServiceMock = new MockLdapService();
			app.unuse('/ldap');
			app.use('/ldap', ldapServiceMock);
		});

		it('should return all users', async () => {
			const instance = new GeneralLDAPStrategy(app, mockLDAPConfig);
			const users = await instance.getUsers();
			// console.log(users);
		});
	});
});
