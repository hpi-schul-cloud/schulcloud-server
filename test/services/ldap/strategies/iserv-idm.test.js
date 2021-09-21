const { expect } = require('chai');
const sinon = require('sinon');

const appPromise = require('../../../../src/app');

const AbstractLDAPStrategy = require('../../../../src/services/ldap/strategies/interface');
const IservIdmLDAPStrategy = require('../../../../src/services/ldap/strategies/iserv-idm');

describe('IservIdmLDAPStrategy', () => {
	it('implements AbstractLDAPStrategy', () => {
		expect(new IservIdmLDAPStrategy()).to.be.instanceOf(AbstractLDAPStrategy);
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
				searchCollection: sinon.fake.returns([
					{ dn: 'o=Testschule,dc=de', o: 'Testschule' },
					{ dn: 'o=hvk,dc=schule', description: 'Heinrich-von-Kleist-Schule', o: 'hvk' },
				]),
			};
		}

		beforeEach(() => {
			ldapServiceMock = new MockLdapService();
			app.use('/ldap', ldapServiceMock);
		});

		it('should search at the given root path and fall back to empty string', async () => {
			const configWithoutRootPath = {
				url: 'ldaps://foo.bar:636',
			};
			await new IservIdmLDAPStrategy(app, configWithoutRootPath).getSchools();
			expect(ldapServiceMock.searchCollection.calledWith(configWithoutRootPath, '')).to.equal(true);

			const mockConfig = {
				url: 'ldaps://foo.bar:636',
				rootPath: 'cn=foo,cn=bar',
			};
			await new IservIdmLDAPStrategy(app, mockConfig).getSchools();
			expect(ldapServiceMock.searchCollection.calledWith(mockConfig, mockConfig.rootPath)).to.equal(true);
		});

		it('should return all school-like entities', async () => {
			const schools = await new IservIdmLDAPStrategy(app, {}).getSchools();
			expect(schools.length).to.equal(2);
		});

		it('should return schools compliant with internal interface', async () => {
			const schools = await new IservIdmLDAPStrategy(app, {}).getSchools();
			schools.forEach((school) => {
				expect(school).to.haveOwnProperty('ldapOu');
				expect(school).to.haveOwnProperty('displayName');
			});
		});

		it('should request all necessary attributes from the server', async () => {
			await new IservIdmLDAPStrategy(app, {}).getSchools();
			[('description', 'o', 'dn')].forEach((attr) =>
				expect(ldapServiceMock.searchCollection.lastArg.attributes).to.include(attr)
			);
		});

		it('should search for objectClass=organization', async () => {
			await new IservIdmLDAPStrategy(app, {}).getSchools();
			expect(ldapServiceMock.searchCollection.lastArg.filter).to.equal('objectClass=organization');
		});
	});

	describe('#getUsers', () => {
		function MockLdapService() {
			return {
				setup: () => {},
				searchCollection: sinon.fake.returns([
					{
						dn: 'cn=student1,ou=users,o=Testschule,dc=de',
						givenName: 'Max',
						sn: 'Mustermann',
						uuid: '00001',
						cn: 'student1',
						mail: 'student1@testschule.de',
						objectClass: ['person', 'posixAccount', 'weirdThirdPartyClass'],
						memberOf: [
							'cn=ROLE_STUDENT,ou=roles,o=Testschule,dc=de',
							'cn=class9a,ou=groups,o=Testschule,dc=de',
							'cn=schuelersprecher,ou=groups,o=Testschule,dc=de',
						],
						modifyTimestamp: '20201020000000Z',
					},
					{
						dn: 'cn=student2,ou=users,o=Testschule,dc=de',
						givenName: 'Marla',
						sn: 'Mathe',
						uuid: '00002',
						cn: 'student2',
						mail: 'student2@testschule.de',
						objectClass: ['person', 'posixAccount'],
						memberOf: [
							'cn=ROLE_STUDENT,ou=roles,o=Testschule,dc=de',
							'cn=class9b,ou=groups,o=Testschule,dc=de',
							'cn=ROLE_NBC_EXCLUDE,ou=groups,o=Testschule,dc=de',
						],
						modifyTimestamp: '20201020111111Z',
					},
					{
						dn: 'cn=teacher,ou=users,o=Testschule,dc=de',
						givenName: 'Herr',
						sn: 'Lempel',
						uuid: '00003',
						cn: 'teacher',
						mail: 'teacher@testschule.de',
						objectClass: ['person', 'posixAccount'],
						memberOf: [
							'cn=ROLE_TEACHER,ou=roles,o=Testschule,dc=de',
							'cn=Kollegium,ou=groups,o=Testschule,dc=de',
							'cn=ToepferAG,ou=groups,o=Testschule,dc=de',
						],
						modifyTimestamp: '20201020222222Z',
					},
					{
						dn: 'cn=admin,ou=users,o=Testschule,dc=de',
						givenName: '',
						sn: 'Testington',
						uuid: '00004',
						cn: 'admin',
						mail: 'admin@testschule.de',
						objectClass: ['person', 'posixAccount'],
						memberOf: [
							'cn=ROLE_TEACHER,ou=roles,o=Testschule,dc=de',
							'cn=ROLE_ADMIN,ou=roles,o=Testschule,dc=de',
							'cn=Kollegium,ou=groups,o=Testschule,dc=de',
							'cn=TYPO3Experten,ou=groups,o=Testschule,dc=de',
						],
						modifyTimestamp: '20201020333333Z',
					},
				]),
			};
		}

		beforeEach(() => {
			ldapServiceMock = new MockLdapService();
			app.use('/ldap', ldapServiceMock);
		});

		it('should return all non-ignored users', async () => {
			const school = {
				ldapSchoolIdentifier: 'o=Testschule,dc=de',
			};
			const users = await new IservIdmLDAPStrategy(app, {}).getUsers(school);
			expect(users.length).to.equal(3); // student2 is member of excluded role
		});

		it('should follow the internal interface', async () => {
			const users = await new IservIdmLDAPStrategy(app, {}).getUsers({});
			users.forEach((user) => {
				['email', 'firstName', 'lastName', 'roles', 'ldapDn', 'ldapUUID', 'ldapUID', 'modifyTimestamp'].forEach(
					(attr) => {
						expect(user).to.haveOwnProperty(attr);
					}
				);
			});
		});

		it('should assign name defaults if entities lack first names', async () => {
			const users = await new IservIdmLDAPStrategy(app, {}).getUsers({});
			expect(users[2].firstName).to.equal('Lehrkraft');
		});

		it('should assign roles based on specific group memberships', async () => {
			const users = await new IservIdmLDAPStrategy(app, {}).getUsers({});
			expect(users[0].roles).to.include('student');
			expect(users[1].roles).to.include('teacher');
			expect(users[2].roles).to.include('teacher').and.to.include('administrator');
		});

		it('should not use delta-sync operational attributes in query if no previous sync went through', async () => {
			await new IservIdmLDAPStrategy(app, {}).getUsers({});
			expect(ldapServiceMock.searchCollection.lastArg.filter).not.to.include('modifyTimestamp');
		});

		it('should filter for modifyTimestamp if applicable', async () => {
			const school = {
				ldapLastSync: '20201020000000Z',
			};
			await new IservIdmLDAPStrategy(app, {}).getUsers(school);
			expect(ldapServiceMock.searchCollection.lastArg.filter).not.to.include('modifyTimestamp');
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
			const classes = await new IservIdmLDAPStrategy(app, {}).getClasses(school);
			expect(classes.length).to.equal(2);
		});

		it('should follow the internal interface', async () => {
			const classes = await new IservIdmLDAPStrategy(app, {}).getClasses({});
			classes.forEach((klass) => {
				['className', 'ldapDn', 'uniqueMembers', 'modifyTimestamp'].forEach((attr) => {
					expect(klass).to.haveOwnProperty(attr);
				});
			});
		});

		it('should search in ou=groups', async () => {
			const mockConfig = {};
			await new IservIdmLDAPStrategy(app, mockConfig).getClasses({ ldapSchoolIdentifier: 'cn=foo,cn=bar' });
			expect(ldapServiceMock.searchCollection.calledWith(mockConfig, 'ou=groups,cn=foo,cn=bar')).to.equal(true);
		});

		it('should return all members as array', async () => {
			const classes = await new IservIdmLDAPStrategy(app, {}).getClasses({});
			expect(classes[0].uniqueMembers).to.be.instanceOf(Array).and.to.have.length(3);
			expect(classes[1].uniqueMembers).to.be.instanceOf(Array).and.to.have.length(2);
		});

		it('should not use delta-sync operational attributes in query if no previous sync went through', async () => {
			await new IservIdmLDAPStrategy(app, {}).getClasses({});
			expect(ldapServiceMock.searchCollection.lastArg.filter).not.to.include('modifyTimestamp');
		});

		it('should filter for modifyTimestamp if applicable', async () => {
			const school = {
				ldapLastSync: '20201020000000Z',
			};
			await new IservIdmLDAPStrategy(app, {}).getClasses(school);
			expect(ldapServiceMock.searchCollection.lastArg.filter).not.to.include('modifyTimestamp');
		});
	});
});
