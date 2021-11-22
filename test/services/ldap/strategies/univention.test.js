const { expect } = require('chai');
const sinon = require('sinon');

const appPromise = require('../../../../src/app');

const AbstractLDAPStrategy = require('../../../../src/services/ldap/strategies/interface');
const UniventionLDAPStrategy = require('../../../../src/services/ldap/strategies/univention');

const mockLDAPConfig = {
	url: 'ldaps://foo.bar:636',
	providerOptions: {},
};

describe.only('UniventionLDAPStrategy', () => {
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
		const ldapFakeSchoolSearchResult = [
			{ ou: '1', displayname: 'Testschule-1' },
			{ ou: '2', displayname: 'Testschule-2' },
		];

		function MockLdapService() {
			return {
				setup: () => {},
				searchCollection: sinon.fake.resolves(ldapFakeSchoolSearchResult),
			};
		}

		beforeEach(() => {
			ldapServiceMock = new MockLdapService();
			app.use('/ldap', ldapServiceMock);
		});

		it('should search at the given root path and fall back to empty string', async () => {
			const searchOptions = {
				filter: `(&(univentionObjectType=container/ou)(!(ucsschoolRole=school:ou:no_school))(objectClass=ucsschoolOrganizationalUnit))`,
				scope: 'sub',
				attributes: [],
			};
			const configWithoutRootPath = {
				url: 'ldaps://foo.bar:636',
				providerOptions: {},
			};
			await new UniventionLDAPStrategy(app, configWithoutRootPath).getSchools();
			expect(ldapServiceMock.searchCollection.calledWith(configWithoutRootPath, '', searchOptions)).to.equal(true);

			const mockConfig = {
				url: 'ldaps://foo.bar:636',
				rootPath: 'cn=foo,cn=bar',
				providerOptions: {},
			};
			await new UniventionLDAPStrategy(app, mockConfig).getSchools();
			expect(ldapServiceMock.searchCollection.calledWith(mockConfig, mockConfig.rootPath, searchOptions)).to.equal(
				true
			);
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

		it('should return schools filled with the values of the LDAP search result', async () => {
			const [school1, school2] = await new UniventionLDAPStrategy(app, mockLDAPConfig).getSchools();
			const [fakeSearchResult1, fakeSearchResult2] = ldapFakeSchoolSearchResult;

			expect(school1.ldapOu).to.equal(fakeSearchResult1.ou);
			expect(school1.displayName).to.equal(fakeSearchResult1.displayName);

			expect(school2.ldapOu).to.equal(fakeSearchResult2.ou);
			expect(school2.displayName).to.equal(fakeSearchResult2.displayName);
		});

		it('should search with the right search string', async () => {
			await new UniventionLDAPStrategy(app, mockLDAPConfig).getSchools();
			const expectedSearchString =
				'(&(univentionObjectType=container/ou)(!(ucsschoolRole=school:ou:no_school))(objectClass=ucsschoolOrganizationalUnit))';
			expect(ldapServiceMock.searchCollection.lastArg.filter).to.equal(expectedSearchString);
		});

		it('should handle excluded schools in the search string', async () => {
			const excludedSchoolOus = ['1', '2'];
			const ldapConfig = {
				...mockLDAPConfig,
				providerOptions: { ...mockLDAPConfig.providerOptions, ignoreSchools: excludedSchoolOus },
			};
			await new UniventionLDAPStrategy(app, ldapConfig).getSchools();
			const expectedSearchString =
				'(&(univentionObjectType=container/ou)(!(ucsschoolRole=school:ou:no_school))(objectClass=ucsschoolOrganizationalUnit)' +
				`(!(ou=${excludedSchoolOus[0]}))` +
				`(!(ou=${excludedSchoolOus[1]})))`;
			expect(ldapServiceMock.searchCollection.lastArg.filter).to.equal(expectedSearchString);
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
			const school = { ldapSchoolIdentifier: 'o=Testschule,dc=de' };
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

		it('should call searchCollection with the right parameters', async () => {
			const school = { ldapSchoolIdentifier: 'o-Testschule,dc=de' };
			await new UniventionLDAPStrategy(app, mockLDAPConfig).getUsers(school);
			const expectedSearchString = `cn=users,ou=${school.ldapSchoolIdentifier},${mockLDAPConfig.rootPath}`;
			const expectedSearchOptions = {
				filter: 'univentionObjectType=users/user',
				scope: 'sub',
				attributes: ['givenName', 'sn', 'mailPrimaryAdress', 'mail', 'dn', 'entryUUID', 'uid', 'objectClass'],
			};
			expect(ldapServiceMock.searchCollection).to.have.been.calledWith(
				mockLDAPConfig,
				expectedSearchString,
				expectedSearchOptions
			);
		});

		it('should assign roles based on specific group memberships', async () => {
			const users = await new UniventionLDAPStrategy(app, mockLDAPConfig).getUsers({});
			expect(users[0].roles).to.include('student');
			expect(users[1].roles).to.include('student');
			expect(users[2].roles).to.include('teacher');
		});
	});

	describe('#getClasses', () => {
		const ldapFakeClassSearchResult = [
			{
				description: '1a',
				dn: 'cn=100000-3GEGDV64GIHO39TI,cn=klassen,cn=schueler,cn=groups,ou=100000,dc=training,dc=ucs',
				uniqueMember: [
					'uid=max1,cn=schueler,cn=users,ou=1,dc=training,dc=ucs',
					'uid=marla1,cn=schueler,cn=users,ou=1,dc=training,dc=ucs',
					'uid=herr.lempel,cn=lehrer,cn=users,ou=100000,dc=training,dc=ucs',
				],
			},
			{
				description: '1b',
				dn: 'cn=100000-4GEGDV64GIHO39TI,cn=klassen,cn=schueler,cn=groups,ou=100000,dc=training,dc=ucs',
				uniqueMember: [
					'uid=max1,cn=schueler,cn=users,ou=1,dc=training,dc=ucs',
					'uid=herr.lempel,cn=lehrer,cn=users,ou=100000,dc=training,dc=ucs',
				],
			},
		];
		function MockLdapService() {
			return {
				setup: () => {},
				searchCollection: sinon.fake.resolves(ldapFakeClassSearchResult),
			};
		}

		beforeEach(() => {
			ldapServiceMock = new MockLdapService();
			app.use('/ldap', ldapServiceMock);
		});

		it('should return all classes', async () => {
			const school = {
				ldapSchoolIdentifier: 'o=Testschule,dc=de',
			};
			const classes = await new UniventionLDAPStrategy(app, mockLDAPConfig).getClasses(school);
			expect(classes.length).to.equal(2);
		});

		it('should follow the internal interface', async () => {
			const classes = await new UniventionLDAPStrategy(app, mockLDAPConfig).getClasses({});
			classes.forEach((klass) => {
				['className', 'ldapDn', 'uniqueMembers'].forEach((attr) => {
					expect(klass).to.haveOwnProperty(attr);
				});
			});
		});

		it('should return classes filled with the values of the LDAP search result', async () => {
			const [class1, class2] = await new UniventionLDAPStrategy(app, mockLDAPConfig).getClasses({});
			const [fakeSearchResult1, fakeSearchResult2] = ldapFakeClassSearchResult;

			expect(class1.className).to.equal(fakeSearchResult1.description);
			expect(class1.ldapDn).to.equal(fakeSearchResult1.dn);
			expect(class1.uniqueMembers).to.equal(fakeSearchResult1.uniqueMember);

			expect(class2.className).to.equal(fakeSearchResult2.description);
			expect(class2.ldapDn).to.equal(fakeSearchResult2.dn);
			expect(class2.uniqueMembers).to.equal(fakeSearchResult2.uniqueMember);
		});

		it('should search in cn=groups', async () => {
			const ldapSchoolIdentifier = 'cn=foo,cn=bar';
			await new UniventionLDAPStrategy(app, mockLDAPConfig).getClasses({ ldapSchoolIdentifier });
			expect(
				ldapServiceMock.searchCollection.calledWith(
					mockLDAPConfig,
					`cn=klassen,cn=schueler,cn=groups,ou=${ldapSchoolIdentifier},${mockLDAPConfig.rootPath}`
				)
			).to.equal(true);
		});

		it('should return all members as array', async () => {
			const classes = await new UniventionLDAPStrategy(app, mockLDAPConfig).getClasses({});
			expect(classes[0].uniqueMembers).to.be.instanceOf(Array).and.to.have.length(3);
			expect(classes[1].uniqueMembers).to.be.instanceOf(Array).and.to.have.length(2);
		});
	});
});
