const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const reqlib = require('app-root-path').require;
const { Configuration } = require('@hpi-schul-cloud/commons');

const { Forbidden } = reqlib('src/errors');

const LDAPConnectionError = require('../../../src/services/ldap/LDAPConnectionError');
const knownGoodConfig = require('./assets/knownGoodConfig.json');
const knownBadConfig = require('./assets/knownBadConfig.json');

chai.use(chaiAsPromised);
chai.use(chaiHttp);
const { expect } = chai;

describe('LdapConfigService', () => {
	let app;
	let server;
	let configBefore;
	let testObjects;

	before(async () => {
		delete require.cache[require.resolve('../../../src/app')];
		configBefore = Configuration.toObject({ plainSecrets: true });
		Configuration.set('FEATURE_API_VALIDATION_ENABLED', true);
		Configuration.set('FEATURE_API_RESPONSE_VALIDATION_ENABLED', true);
		// eslint-disable-next-line global-require
		const appPromise = require('../../../src/app');
		// eslint-disable-next-line global-require
		testObjects = require('../helpers/testObjects')(appPromise);
		app = await appPromise;
		server = await app.listen(0);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
		Configuration.reset(configBefore);
	});

	describe('GET route', () => {
		let generalLdapSystem1;
		let iservLdapSystem1;
		let otherSystem1;
		let system2;
		let school1;
		let school2;
		let admin1;
		let teacher2;
		let paramsAdmin1;
		let paramsTeacher2;

		before(async () => {
			generalLdapSystem1 = await testObjects.createTestSystem({
				type: 'ldap',
				ldapConfig: {
					url: 'ldaps://foo.bar:636',
					provider: 'general',
					providerOptions: {},
				},
			});
			iservLdapSystem1 = await testObjects.createTestSystem({
				type: 'ldap',
				ldapConfig: {
					url: 'ldaps://foo.bar:10636',
					provider: 'iserv',
					providerOptions: {},
				},
			});
			otherSystem1 = await testObjects.createTestSystem({
				type: 'moodle',
			});
			school1 = await testObjects.createTestSchool({
				systems: [generalLdapSystem1._id, iservLdapSystem1._id, otherSystem1._id],
			});
			admin1 = await testObjects.createTestUser({
				schoolId: school1._id,
				roles: ['administrator'],
			});
			paramsAdmin1 = await testObjects.generateRequestParamsFromUser(admin1);

			system2 = await testObjects.createTestSystem({
				type: 'ldap',
				ldapConfig: {
					url: 'ldaps://badumm.tsss',
					provider: 'general',
					providerOptions: {},
				},
			});
			school2 = await testObjects.createTestSchool({
				systems: [system2._id],
			});
			teacher2 = await testObjects.createTestUser({
				schoolId: school2._id,
				roles: ['teacher'],
			});
			paramsTeacher2 = await testObjects.generateRequestParamsFromUser(teacher2);
		});

		it("should allow accessing the LDAP config of the user's school", async () => {
			const result = await app.service('legacy/v1/ldap-config').get(generalLdapSystem1._id, paramsAdmin1);
			// also note that this does not return the system, but the ldapConfig
			expect(result.provider).to.equal('general');
			expect(result.url).to.equal('ldaps://foo.bar:636');
		});

		it('should not allow accessing systems with provider!=general', async () => {
			expect(app.service('legacy/v1/ldap-config').get(iservLdapSystem1._id, paramsAdmin1)).to.eventually.throw(
				new Forbidden()
			);
		});

		it('should not allow accessing non-ldap systems', async () => {
			expect(app.service('legacy/v1/ldap-config').get(otherSystem1._id, paramsAdmin1)).to.eventually.throw(
				new Forbidden()
			);
		});

		it('should not allow accessing systems of different schools', async () => {
			expect(app.service('legacy/v1/ldap-config').get(system2._id, paramsAdmin1)).to.eventually.throw(new Forbidden());
		});

		it('should not allow accessing a system if not admin', async () => {
			expect(app.service('legacy/v1/ldap-config').get(system2._id, paramsTeacher2)).to.eventually.throw(
				new Forbidden()
			);
		});
	});

	describe('CREATE route', () => {
		let school;
		let admin;
		let params;

		let originalLdapService;
		let ldapServiceMock;

		const fakeUsers = [
			{ firstName: 'Hasso', roles: ['administrator'] },
			{ firstName: 'Christoph', roles: ['teacher'] },
			{ firstName: 'Jan', roles: ['student'] },
		];
		const fakeClasses = [
			{ description: '7a', uniqueMembers: [] },
			{ description: '8b', uniqueMembers: [] },
		];

		function MockLdapService() {
			return {
				setup: () => {},
				getUsers: sinon.fake.resolves(fakeUsers),
				verifyConfig: sinon.fake.resolves(fakeUsers),
				getClasses: sinon.fake.resolves(fakeClasses),
				disconnect: sinon.fake.resolves(),
			};
		}

		beforeEach(() => {
			ldapServiceMock = new MockLdapService();
			app.use('ldap', ldapServiceMock);
		});

		before(() => {
			originalLdapService = app.service('ldap');
		});

		after(() => {
			app.use('ldap', originalLdapService);
		});

		beforeEach(async () => {
			school = await testObjects.createTestSchool({
				systems: [],
			});
			admin = await testObjects.createTestUser({
				schoolId: school._id,
				roles: ['administrator'],
			});
			params = await testObjects.generateRequestParamsFromUser(admin);
		});

		it("should allow adding a new system based on the given LDAP config to the user's school", async () => {
			const result = await app.service('legacy/v1/ldap-config').create(knownGoodConfig, params);
			expect(result.ok).to.equal(true);

			const patchedSchool = await app.service('schools').get(school._id, { query: { $populate: 'systems' } });
			expect(patchedSchool.systems.length).to.equal(1);
			expect(patchedSchool.systems[0].ldapConfig.active).to.equal(true);
			expect(patchedSchool.ldapSchoolIdentifier).to.equal(knownGoodConfig.rootPath);

			testObjects.info().testSystem.push(patchedSchool.systems[0]._id);
		});

		it('should honor the activate param', async () => {
			const result = await app
				.service('legacy/v1/ldap-config')
				.create(knownGoodConfig, { ...params, query: { activate: false } });
			expect(result.ok).to.equal(true);

			const patchedSchool = await app.service('schools').get(school._id, { query: { $populate: 'systems' } });
			expect(patchedSchool.systems.length).to.equal(1);
			expect(patchedSchool.systems[0].ldapConfig.active).to.equal(false);
			expect(patchedSchool.ldapSchoolIdentifier).to.equal(undefined);

			testObjects.info().testSystem.push(patchedSchool.systems[0]._id);
		});

		it('should not save with verifyOnly=true', async () => {
			const result = await app
				.service('legacy/v1/ldap-config')
				.create(knownGoodConfig, { ...params, query: { verifyOnly: true } });
			expect(result.ok).to.equal(true);
			expect(result.users.admin).to.equal(1);
			expect(result.users.teacher).to.equal(1);
			expect(result.users.student).to.equal(1);
			expect(result.users.total).to.equal(3);
			expect(result.classes.total).to.equal(2);

			const patchedSchool = await app.service('schools').get(school._id);
			expect(patchedSchool.systems.length).to.equal(0);
			expect(patchedSchool.ldapSchoolIdentifier).to.equal(undefined);
		});

		it('should catch common errors', async () => {
			ldapServiceMock.verifyConfig = sinon.fake.rejects(new LDAPConnectionError());
			app.use('ldap', ldapServiceMock);

			const result = await app
				.service('legacy/v1/ldap-config')
				.create(knownGoodConfig, { ...params, query: { activate: false } });
			expect(result.ok).to.equal(false);
			expect(result.errors.length).to.equal(1);
			expect(result.errors[0].type).to.equal('CONNECTION_ERROR');
		});

		it('should succeed via external API', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId });
			const token = await testObjects.generateJWTFromUser(user);
			const request = chai
				.request(app)
				.post('/ldap-config?verifyOnly=true')
				.set('Accept', 'application/json')
				.set('Authorization', `Bearer ${token}`)
				.set('content-type', 'application/json');
			const response = await request.send(knownGoodConfig);
			expect(response.status).to.equal(201);
			expect(response.body.ok).to.equal(true);
		});

		it('should return 400 if required parameters are missing', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId });
			const token = await testObjects.generateJWTFromUser(user);
			const request = chai
				.request(app)
				.post('/ldap-config')
				.set('Accept', 'application/json')
				.set('Authorization', `Bearer ${token}`)
				.set('content-type', 'application/json');
			const response = await request.send(knownBadConfig);
			expect(response.status).to.equal(400);
			expect(response.body.message).to.include("request.body should have required property 'rootPath'");
		});
	});

	describe('PATCH route', () => {
		let system;
		let school;
		let admin;
		let params;

		let originalLdapService;
		let ldapServiceMock;

		const fakeUsers = [
			{ firstName: 'Hasso', roles: ['administrator'] },
			{ firstName: 'Christoph', roles: ['teacher'] },
			{ firstName: 'Jan', roles: ['student'] },
		];
		const fakeClasses = [
			{ description: '7a', uniqueMembers: [] },
			{ description: '8b', uniqueMembers: [] },
		];

		function MockLdapService() {
			return {
				setup: () => {},
				getUsers: sinon.fake.resolves(fakeUsers),
				verifyConfig: sinon.fake.resolves(fakeUsers),
				getClasses: sinon.fake.resolves(fakeClasses),
				disconnect: sinon.fake.resolves(),
			};
		}

		beforeEach(() => {
			ldapServiceMock = new MockLdapService();
			app.use('ldap', ldapServiceMock);
		});

		before(() => {
			originalLdapService = app.service('ldap');
		});

		after(() => {
			app.use('ldap', originalLdapService);
		});

		beforeEach(async () => {
			system = await testObjects.createTestSystem({
				type: 'ldap',
				ldapConfig: {
					provider: 'general',
					providerOptions: {
						url: 'ldaps://foo.bar',
					},
					active: false,
				},
			});
			school = await testObjects.createTestSchool({
				systems: [system._id],
			});
			admin = await testObjects.createTestUser({
				schoolId: school._id,
				roles: ['administrator'],
			});
			params = await testObjects.generateRequestParamsFromUser(admin);
		});

		it('should verify the given config and patch the system and school', async () => {
			const result = await app.service('legacy/v1/ldap-config').patch(system._id, knownGoodConfig, params);
			expect(result.ok).to.equal(true);

			const patchedSchool = await app.service('schools').get(school._id, { query: { $populate: 'systems' } });
			expect(patchedSchool.systems.length).to.equal(1);
			expect(patchedSchool.systems[0].ldapConfig.active).to.equal(true);
			expect(patchedSchool.ldapSchoolIdentifier).to.equal(knownGoodConfig.rootPath);
		});

		it('should allow to verify only via param', async () => {
			const result = await app
				.service('legacy/v1/ldap-config')
				.patch(system._id, knownGoodConfig, { ...params, query: { verifyOnly: true } });
			expect(result.ok).to.equal(true);
			expect(result.users.admin).to.equal(1);
			expect(result.users.teacher).to.equal(1);
			expect(result.users.student).to.equal(1);

			const patchedSchool = await app.service('schools').get(school._id);
			expect(patchedSchool.systems.length).to.equal(1);
			expect(patchedSchool.ldapSchoolIdentifier).to.equal(undefined);
		});

		it('should allow to update the system without activating', async () => {
			const result = await app
				.service('legacy/v1/ldap-config')
				.patch(system._id, knownGoodConfig, { ...params, query: { activate: false } });
			expect(result.ok).to.equal(true);

			const patchedSchool = await app.service('schools').get(school._id);
			expect(patchedSchool.systems.length).to.equal(1);
			expect(patchedSchool.ldapSchoolIdentifier).to.equal(undefined);

			const patchedSystem = await app.service('systems').get(system._id);
			expect(patchedSystem.ldapConfig.rootPath).to.equal(knownGoodConfig.rootPath);
			expect(patchedSystem.ldapConfig.active).to.equal(false);
		});
	});
});
