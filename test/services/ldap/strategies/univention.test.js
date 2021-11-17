const { expect } = require('chai');
const sinon = require('sinon');

const appPromise = require('../../../../src/app');

const AbstractLDAPStrategy = require('../../../../src/services/ldap/strategies/interface');
const UniventionLDAPStrategy = require('../../../../src/services/ldap/strategies/univention');

const mockLDAPConfig = {
	url: 'ldaps://foo.bar:636',
	providerOptions: {},
};

describe('UniventionLDAPStrategy', () => {
	it('implements AbstractLDAPStrategy', () => {
		expect(new UniventionLDAPStrategy()).to.be.instanceOf(AbstractLDAPStrategy);
	});

	let originalLdapService;
	let ldapServiceMock;

	let app;

	before(async () => {
		app = await appPromise;
		originalLdapService = app.service('ldap');
	});

	after(() => {
		app.use('/ldap', originalLdapService);
	});

	describe('#getSchools', () => {
		function MockLdapService() {
			return {
				setup: () => {},
				searchCollection: sinon.fake.returns(
					Promise.resolve([
						{ ou: '1', displayname: 'Testschule-1' },
						{ ou: '2', displayname: 'Testschule-2' },
					])
				),
			};
		}

		beforeEach(() => {
			ldapServiceMock = new MockLdapService();
			app.use('/ldap', ldapServiceMock);
		});

		it('should search at the given root path and fall back to empty string', async () => {
			const configWithoutRootPath = {
				url: 'ldaps://foo.bar:636',
				providerOptions: {},
			};
			await new UniventionLDAPStrategy(app, configWithoutRootPath).getSchools();
			expect(ldapServiceMock.searchCollection.calledWith(configWithoutRootPath, '')).to.equal(true);

			const mockConfig = {
				url: 'ldaps://foo.bar:636',
				rootPath: 'cn=foo,cn=bar',
				providerOptions: {},
			};
			await new UniventionLDAPStrategy(app, mockConfig).getSchools();
			expect(ldapServiceMock.searchCollection.calledWith(mockConfig, mockConfig.rootPath)).to.equal(true);
		});

		it('should return all school-like entities', async () => {
			const schools = await new UniventionLDAPStrategy(app, mockLDAPConfig).getSchools();
			expect(schools.length).to.equal(2);
		});

		it('should return schools compliant with internal interface', async () => {
			const schools = await new UniventionLDAPStrategy(app, mockLDAPConfig).getSchools();
			schools.forEach((school) => {
				expect(school).to.haveOwnProperty('ldapOu');
				expect(school).to.haveOwnProperty('displayName');
			});
		});

		it('should search for objectClass=ucsschoolOrganizationalUnit', async () => {
			await new UniventionLDAPStrategy(app, mockLDAPConfig).getSchools();
			expect(ldapServiceMock.searchCollection.lastArg.filter).to.include('objectClass=ucsschoolOrganizationalUnit');
		});
	});

	describe('#getUsers', () => {
		function MockLdapService() {
			return {
				setup: () => {},
				searchCollection: sinon.fake.returns(
					Promise.resolve([
						{
							dn: 'uid=max1,cn=schueler,cn=users,ou=1,dc=training,dc=ucs',
							givenName: 'Max',
							sn: 'Mustermann',
							uid: '00001',
							entryUUID: 'c1872a82-cab3-103b-93e2-4b049df6c5ea',
							mail: 'student1@testschule.de',
							objectClass: ['person', 'posixAccount', 'ucsschoolStudent'],
						},
						{
							dn: 'uid=marla1,cn=schueler,cn=users,ou=1,dc=training,dc=ucs',
							givenName: 'Marla',
							sn: 'Mathe',
							uid: '00002',
							entryUUID: 'c1872a82-cab3-103b-93e2-4b049df6c5eb',
							mail: 'student2@testschule.de',
							objectClass: ['person', 'posixAccount', 'ucsschoolStudent'],
						},
						{
							dn: 'uid=herr.lempel,cn=lehrer,cn=users,ou=100000,dc=training,dc=ucs',
							givenName: 'Herr',
							sn: 'Lempel',
							uid: '00003',
							entryUUID: 'c1872a82-cab3-103b-93e2-4b049df6c5ec',
							mail: 'teacher@testschule.de',
							objectClass: ['person', 'posixAccount', 'ucsschoolTeacher'],
						},
					])
				),
			};
		}

		beforeEach(() => {
			ldapServiceMock = new MockLdapService();
			app.use('/ldap', ldapServiceMock);
		});

		it('should return all users', async () => {
			const school = {
				ldapSchoolIdentifier: 'o=Testschule,dc=de',
			};
			const users = await new UniventionLDAPStrategy(app, mockLDAPConfig).getUsers(school);
			expect(users.length).to.equal(3);
		});

		it('should follow the internal interface', async () => {
			const users = await new UniventionLDAPStrategy(app, mockLDAPConfig).getUsers({});
			users.forEach((user) => {
				['email', 'firstName', 'lastName', 'roles', 'ldapDn', 'ldapUUID', 'ldapUID'].forEach((attr) => {
					expect(user).to.haveOwnProperty(attr);
				});
			});
		});

		it('should assign roles based on specific group memberships', async () => {
			const users = await new UniventionLDAPStrategy(app, mockLDAPConfig).getUsers({});
			expect(users[0].roles).to.include('student');
			expect(users[1].roles).to.include('student');
			expect(users[2].roles).to.include('teacher');
		});
	});

	describe('#getClasses', () => {
		function MockLdapService() {
			return {
				setup: () => {},
				searchCollection: sinon.fake.returns([
					{
						dn: 'cn=klasse9a,ou=groups,o=Testschule,dc=de',
						description: '9a',
						member: [
							'cn=teacher,ou=users,o=Testschule,dc=de',
							'cn=student1,ou=users,o=Testschule,dc=de',
							'cn=student2,ou=users,o=Testschule,dc=de',
						],
						modifyTimestamp: '20201020000000Z',
					},
					{
						dn: 'cn=Kollegium,ou=groups,o=Testschule,dc=de',
						description: 'Alle Lehrkräfte',
						member: ['cn=teacher,ou=users,o=Testschule,dc=de', 'cn=admin,ou=users,o=Testschule,dc=de'],
						modifyTimestamp: '20201020000000Z',
					},
				]),
			};
		}

		beforeEach(() => {
			ldapServiceMock = new MockLdapService();
			app.use('/ldap', ldapServiceMock);
		});

		it('should return all IServ groups as classes', async () => {
			const school = {
				ldapSchoolIdentifier: 'o=Testschule,dc=de',
			};
			const classes = await new UniventionLDAPStrategy(app, {}).getClasses(school);
			expect(classes.length).to.equal(2);
		});

		it('should follow the internal interface', async () => {
			const classes = await new UniventionLDAPStrategy(app, {}).getClasses({});
			classes.forEach((klass) => {
				['className', 'ldapDn', 'uniqueMembers', 'modifyTimestamp'].forEach((attr) => {
					expect(klass).to.haveOwnProperty(attr);
				});
			});
		});

		it('should search in ou=groups', async () => {
			const mockConfig = {};
			await new UniventionLDAPStrategy(app, mockConfig).getClasses({ ldapSchoolIdentifier: 'cn=foo,cn=bar' });
			expect(ldapServiceMock.searchCollection.calledWith(mockConfig, 'ou=groups,cn=foo,cn=bar')).to.equal(true);
		});

		it('should return all members as array', async () => {
			const classes = await new UniventionLDAPStrategy(app, {}).getClasses({});
			expect(classes[0].uniqueMembers).to.be.instanceOf(Array).and.to.have.length(3);
			expect(classes[1].uniqueMembers).to.be.instanceOf(Array).and.to.have.length(2);
		});

		it('should not use delta-sync operational attributes in query if no previous sync went through', async () => {
			await new UniventionLDAPStrategy(app, {}).getClasses({});
			expect(ldapServiceMock.searchCollection.lastArg.filter).not.to.include('modifyTimestamp');
		});

		it('should filter for modifyTimestamp if applicable', async () => {
			const school = {
				ldapLastSync: '20201020000000Z',
			};
			await new UniventionLDAPStrategy(app, {}).getClasses(school);
			expect(ldapServiceMock.searchCollection.lastArg.filter).not.to.include('modifyTimestamp');
		});
	});
});
