const { expect } = require('chai');
const sinon = require('sinon');

const appPromise = require('../../../../src/app');

const AbstractLDAPStrategy = require('../../../../src/services/ldap/strategies/interface');
const GeneralLDAPStrategy = require('../../../../src/services/ldap/strategies/general');

const mockLDAPConfig = {
	url: 'ldaps://foo.bar:636',
	rootPath: 'o=school0,dc=de,dc=example,dc=org',
	providerOptions: {
		schoolName: 'test-school',
		rootPath: 'o=school0,dc=de,dc=example,dc=org',
		userAttributeNameMapping: {
			givenName: 'givenName',
			sn: 'sn',
			dn: 'dn',
			uuid: 'uuid',
			uid: 'uid',
			mail: 'mail',
			role: 'role',
		},
		roleAttributeNameMapping: {
			roleStudent: 'cn=ROLE_STUDENT,ou=roles,o=school0,dc=de,dc=example,dc=org',
			roleTeacher:
				'cn=ROLE_TEACHER,ou=roles,o=school0,dc=de,dc=example,dc=org;;cn=OTHER_TEACHERS,ou=roles,o=school0,dc=de,dc=example,dc=org',
			roleAdmin: 'cn=ROLE_ADMIN,ou=roles,o=school0,dc=de,dc=example,dc=org',
		},
		classAttributeNameMapping: {
			description: 'description',
			dn: 'dn',
			uniqueMember: 'member',
		},
		userPathAdditions: 'ou=users',
		classPathAdditions: 'ou=classes',
		roleType: 'group',
	},
};

const createLDAPUserResult = (props) => {
	return {
		dn: 'uid=max.mustermann.1,ou=users,o=school0,dc=de,dc=example,dc=org',
		givenName: 'Max',
		sn: 'Mustermann',
		uid: 'max.mustermann.1',
		uuid: 'ZDg0Y2ZlMjMtZGYwNi00MWNjLTg3YmUtZjI3NjA1NDJhY2Y0',
		mail: 'max.mustermann.1@example.org',
		memberOf: 'cn=ROLE_STUDENT,ou=roles,o=school0,dc=de,dc=example,dc=org',
		...props,
	};
};

describe('GeneralLDAPStrategy', () => {
	it('implements AbstractLDAPStrategy', () => {
		expect(new GeneralLDAPStrategy()).to.be.instanceOf(AbstractLDAPStrategy);
	});

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

	describe('#getSchools', () => {
		it('should return school compliant with internal interface', async () => {
			const schools = await new GeneralLDAPStrategy(app, mockLDAPConfig).getSchools();
			expect(schools.length).to.equal(1);
			const school = schools[0];
			expect(school).to.haveOwnProperty('ldapOu');
			expect(school).to.haveOwnProperty('displayName');
		});

		it('should return school filled with data from the LDAP configuration', async () => {
			const schools = await new GeneralLDAPStrategy(app, mockLDAPConfig).getSchools();
			expect(schools.length).to.equal(1);
			const school = schools[0];
			expect(school.displayName).to.equal(mockLDAPConfig.providerOptions.schoolName);
			expect(school.ldapOu).to.equal(mockLDAPConfig.providerOptions.rootPath);
		});
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
						memberOf: 'cn=ROLE_STUDENT,ou=roles,o=school0,dc=de,dc=example,dc=org',
					},
					{
						dn: 'uid=marla.mathe.1,ou=users,o=school0,dc=de,dc=example,dc=org',
						givenName: 'Marla',
						sn: 'Mathe',
						uid: 'marla.mathe.1',
						uuid: 'ZDg0Y2ZlMjMtZGYwNi00MWNjLTg3YmUtZjI3NjA1NDJhY2Y1',
						mail: 'marla.mathe.1@example.org',
						memberOf: [
							'cn=ROLE_STUDENT,ou=roles,o=school0,dc=de,dc=example,dc=org',
							'cn=User-centricdedicatedmoratorium,ou=groups,o=school0,dc=de,dc=example,dc=org',
						],
					},
					{
						dn: 'uid=herr.lempel.1,ou=users,o=school0,dc=de,dc=example,dc=org',
						givenName: 'Herr',
						sn: 'Lempel',
						uid: 'herr.lempel.1',
						uuid: 'ZDg0Y2ZlMjMtZGYwNi00MWNjLTg3YmUtZjI3NjA1NDJhY2Y2',
						mail: 'herr.lempel.1@example.org',
						memberOf: [
							'cn=ROLE_TEACHER,ou=roles,o=school0,dc=de,dc=example,dc=org',
							'cn=Mandatoryhigh-levelGraphicInterface,ou=groups,o=school0,dc=de,dc=example,dc=org',
							'cn=Front-linebi-directionalalliance,ou=groups,o=school0,dc=de,dc=example,dc=org',
							'cn=User-centricactuatingportal,ou=groups,o=school0,dc=de,dc=example,dc=org',
						],
					},
					{
						dn: 'uid=testington.1,ou=users,o=school0,dc=de,dc=example,dc=org',
						sn: 'Testington',
						uid: 'testington.1',
						uuid: 'ZDg0Y2ZlMjMtZGYwNi00MWNjLTg3YmUtZjI3NjA1NDJhY2Y3',
						mail: 'testington.1@example.org',
						memberOf: 'cn=ROLE_ADMIN,ou=roles,o=school0,dc=de,dc=example,dc=org',
					},
					{
						dn: 'uid=herr.anwalt,ou=users,o=school0,dc=de,dc=example,dc=org',
						givenName: 'Herr',
						sn: 'Anwalt',
						uid: 'herr.anwalt',
						uuid: 'ZDg0Y2ZlMjMtZGYwNi00MWNjLTg3YmUtZjI3NjA1NDJhY2Y4',
						mail: 'herr.lempel.1@example.org',
						memberOf: [
							'cn=ROLE_TEACHER,ou=roles,o=school0,dc=de,dc=example,dc=org',
							'cn=OTHER_TEACHERS,ou=roles,o=school0,dc=de,dc=example,dc=org',
						],
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
			expect(users.length).to.equal(5);
		});

		it('should follow the internal interface', async () => {
			const users = await new GeneralLDAPStrategy(app, mockLDAPConfig).getUsers();
			users.forEach((user) => {
				['email', 'firstName', 'lastName', 'roles', 'ldapDn', 'ldapUUID', 'ldapUID'].forEach((attr) => {
					expect(user).to.haveOwnProperty(attr);
				});
			});
		});

		it('should search for all user search paths', async () => {
			const userSearchPaths = ['ou:users1', 'ou:users2', 'ou:users3'];
			const ldapConfig = {
				...mockLDAPConfig,
				providerOptions: { ...mockLDAPConfig.providerOptions, userPathAdditions: userSearchPaths.join(';;') },
			};
			await new GeneralLDAPStrategy(app, ldapConfig).getUsers();
			expect(ldapServiceMock.searchCollection.callCount).to.equal(userSearchPaths.length);
			const calls = ldapServiceMock.searchCollection.getCalls();
			calls.forEach((call, index) => {
				const searchPath = call.args[1];
				expect(searchPath).to.equal(`${userSearchPaths[index]},${ldapConfig.rootPath}`);
			});
		});

		it('should assign roles based on specific group memberships for group role type', async () => {
			const [student1, student2, teacher, admin, teacher2] = await new GeneralLDAPStrategy(
				app,
				mockLDAPConfig
			).getUsers();
			expect(student1.roles).to.include('student');
			expect(student2.roles).to.include('student');
			expect(teacher.roles).to.include('teacher');
			expect(admin.roles).to.include('administrator');
			expect(teacher2.roles).to.include('teacher');
		});

		describe('non-group role type', () => {
			it('should assign roles based on specific group memberships', async () => {
				const ldapConfig = {
					...mockLDAPConfig,
					providerOptions: { ...mockLDAPConfig.providerOptions, roleType: 'non-group' },
				};
				app.unuse('/ldap');
				app.use('/ldap', {
					setup: () => {},
					get: () => {},
					searchCollection: sinon.fake.resolves([
						createLDAPUserResult({ role: mockLDAPConfig.providerOptions.roleAttributeNameMapping.roleStudent }),
						createLDAPUserResult({ role: mockLDAPConfig.providerOptions.roleAttributeNameMapping.roleTeacher }),
						createLDAPUserResult({ role: mockLDAPConfig.providerOptions.roleAttributeNameMapping.roleAdmin }),
					]),
				});
				const [student, teacher, admin] = await new GeneralLDAPStrategy(app, ldapConfig).getUsers();
				expect(student.roles).to.include('student');
				expect(teacher.roles).to.include('teacher');
				expect(admin.roles).to.include('administrator');
			});

			it('should skip ldap users with missing userAttributeNameMapping.role', async () => {
				const ldapConfig = {
					...mockLDAPConfig,
					providerOptions: {
						...mockLDAPConfig.providerOptions,
						roleType: 'text',
						userAttributeNameMapping: { ...mockLDAPConfig.providerOptions.userAttributeNameMapping, role: 'vcEXtype' },
						roleAttributeNameMapping: {
							...mockLDAPConfig.providerOptions.roleAttributeNameMapping,
							roleStudent: '311',
						},
					},
				};
				app.unuse('/ldap');
				app.use('/ldap', {
					setup: () => {},
					get: () => {},
					searchCollection: sinon.fake.resolves([
						createLDAPUserResult({ vcEXtype: '311' }),
						createLDAPUserResult({ vcEXtype: undefined }),
					]),
				});

				const result = await new GeneralLDAPStrategy(app, ldapConfig).getUsers();

				expect(result.length).to.equal(1);
			});
		});

		it('should assign name defaults if entities lack first names', async () => {
			app.unuse('/ldap');
			app.use(
				'/ldap',
				{
					setup: () => {},
					get: () => {},
					searchCollection: sinon.fake.resolves([
						createLDAPUserResult({
							givenName: '',
							memberOf: mockLDAPConfig.providerOptions.roleAttributeNameMapping.roleStudent,
						}),
						createLDAPUserResult({
							givenName: '',
							memberOf: mockLDAPConfig.providerOptions.roleAttributeNameMapping.roleTeacher.split(';;')[0],
						}),
						createLDAPUserResult({
							givenName: '',
							memberOf: mockLDAPConfig.providerOptions.roleAttributeNameMapping.roleAdmin,
						}),
					]),
				},
				{
					// Pass all methods you want to expose
					methods: ['searchCollection'],
				}
			);
			const [student, teacher, admin] = await new GeneralLDAPStrategy(app, mockLDAPConfig).getUsers();
			expect(student.firstName).to.equal('Schüler:in');
			expect(teacher.firstName).to.equal('Lehrkraft');
			expect(admin.firstName).to.equal('Admin');
		});
	});

	describe('#getClasses', () => {
		function MockLdapService() {
			return {
				setup: () => {},
				get: () => {},
				searchCollection: sinon.fake.returns(
					Promise.resolve([
						{
							dn: 'cn=100001,cn=klassen,cn=schueler,cn=groups,ou=100000,dc=training,dc=ucs',
							description: '1a',
							member: [
								'uid=herr.lempel.1,ou=users,o=school0,dc=de,dc=example,dc=org',
								'uid=max.mustermann.1,ou=users,o=school0,dc=de,dc=example,dc=org',
								'uid=marla.mathe.1,ou=users,o=school0,dc=de,dc=example,dc=org',
							],
						},
						{
							dn: 'cn=100002,cn=klassen,cn=schueler,cn=groups,ou=100000,dc=training,dc=ucs',
							description: '1b',
							member: [
								'uid=herr.lempel.1,ou=users,o=school0,dc=de,dc=example,dc=org',
								'uid=max.mustermann.1,ou=users,o=school0,dc=de,dc=example,dc=org',
							],
						},
					])
				),
			};
		}

		beforeEach(() => {
			ldapServiceMock = new MockLdapService();
			app.unuse('/ldap');
			app.use('/ldap', ldapServiceMock);
		});

		it('should return all classes', async () => {
			const classes = await new GeneralLDAPStrategy(app, mockLDAPConfig).getClasses();
			expect(classes.length).to.equal(2);
		});

		it('should follow the internal interface', async () => {
			const classes = await new GeneralLDAPStrategy(app, mockLDAPConfig).getClasses();
			classes.forEach((klass) => {
				['className', 'ldapDn', 'uniqueMembers'].forEach((attr) => {
					expect(klass).to.haveOwnProperty(attr);
				});
			});
		});

		it('should build the search string correctly from the LDAP configuration', async () => {
			await new GeneralLDAPStrategy(app, mockLDAPConfig).getClasses();
			expect(
				ldapServiceMock.searchCollection.calledWith(
					mockLDAPConfig,
					`${mockLDAPConfig.providerOptions.classPathAdditions},${mockLDAPConfig.rootPath}`
				)
			).to.equal(true);
		});

		it('should return all members as array', async () => {
			const classes = await new GeneralLDAPStrategy(app, mockLDAPConfig).getClasses({});
			expect(classes[0].uniqueMembers).to.be.instanceOf(Array).and.to.have.length(3);
			expect(classes[1].uniqueMembers).to.be.instanceOf(Array).and.to.have.length(2);
		});

		it('should return an empty array if required config values are missing', async () => {
			const requiredProviderOptionValues = [
				'classPathAdditions',
				'classAttributeNameMapping.dn',
				'classAttributeNameMapping.description',
				'classAttributeNameMapping.uniqueMember',
			];
			for (const configValue of requiredProviderOptionValues) {
				const configCopy = JSON.parse(JSON.stringify(mockLDAPConfig));
				const configPath = configValue.split('.');
				if (configPath.length === 1) configCopy.providerOptions[configPath[0]] = '';
				if (configPath.length === 2) configCopy.providerOptions[configPath[0]][configPath[1]] = '';

				// eslint-disable-next-line no-await-in-loop
				const classes = await new GeneralLDAPStrategy(app, configCopy).getClasses();
				expect(classes).to.be.empty;
			}
		});
	});
});
