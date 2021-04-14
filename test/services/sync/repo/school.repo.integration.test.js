const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { SchoolRepo } = require('../../../../src/services/sync/repo');
const { schoolModel } = require('../../../../src/services/school/model');

const appPromise = require('../../../../src/app');

const testObjects = require('../../helpers/testObjects')(appPromise);

chai.use(chaiAsPromised);
const { expect } = chai;

describe('school repo', () => {
	let app;
	let server;
	let repo;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
		repo = new SchoolRepo(app);
	});

	beforeEach(async () => {});

	afterEach(async () => {
		await testObjects.cleanup();
	});

	after(async () => {
		await server.close();
	});

	it('should successfully create new school', async () => {
		const schoolName = 'Test School';
		const res = await repo.create({ name: schoolName });
		expect(res._id).to.be.not.undefined;
		expect(res.name).to.be.equal(schoolName);

		await schoolModel.remove(res);
	});

	it('should successfully update school name', async () => {
		const schoolName = 'New Test School';
		const school = await testObjects.createTestSchool({});
		const res = await repo.updateName(school._id, schoolName);
		expect(res.name).to.be.equal(schoolName);
	});

	it('should return undefined for empty parameters', async () => {
		const res = await repo.findByLdapIdAndSystem(undefined, undefined);
		expect(res).to.be.undefined;
	});

	it('should find school by ldap and system', async () => {
		const ldapSchoolIdentifier = 'LDAP_ID';
		const system = await testObjects.createTestSystem();
		const school = await testObjects.createTestSchool({ ldapSchoolIdentifier, systems: [system._id] });
		const res = await repo.findByLdapIdAndSystem(ldapSchoolIdentifier, system._id);
		expect(res._id.toString()).to.be.equal(school._id.toString());
	});

	it('should return school from cache for same ldap and system', async () => {
		const ldapSchoolIdentifier = 'LDAP_ID';
		const system = await testObjects.createTestSystem();
		await testObjects.createTestSchool({ ldapSchoolIdentifier, systems: [system._id] });
		const res = await repo.findByLdapIdAndSystem(ldapSchoolIdentifier, system._id);
		expect(res.fromCache).to.be.undefined;

		const res2 = await repo.findByLdapIdAndSystem(ldapSchoolIdentifier, system._id);
		expect(res2.fromCache).to.be.true;
	});
});
