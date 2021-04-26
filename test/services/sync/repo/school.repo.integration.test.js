const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const SchoolRepo = require('../../../../src/services/sync/repo/school.repo');
const { schoolModel } = require('../../../../src/services/school/model');

const appPromise = require('../../../../src/app');

const testObjects = require('../../helpers/testObjects')(appPromise);

chai.use(chaiAsPromised);
const { expect } = chai;

describe('school repo', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
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
		const res = await SchoolRepo.createSchool({ name: schoolName });
		expect(res._id).to.be.not.undefined;
		expect(res.name).to.be.equal(schoolName);

		await schoolModel.remove(res);
	});

	it('should successfully update school name', async () => {
		const schoolName = 'New Test School';
		const school = await testObjects.createTestSchool({});
		const res = await SchoolRepo.updateSchoolName(school._id, schoolName);
		expect(res.name).to.be.equal(schoolName);
	});

	it('should return null if not found', async () => {
		const res = await SchoolRepo.findSchoolByLdapIdAndSystem('not existed dn', undefined);
		expect(res).to.be.null;
	});

	it('should find school by ldap and system', async () => {
		const ldapSchoolIdentifier = 'LDAP_ID';
		const system = await testObjects.createTestSystem();
		const school = await testObjects.createTestSchool({ ldapSchoolIdentifier, systems: [system._id] });
		const res = await SchoolRepo.findSchoolByLdapIdAndSystem(ldapSchoolIdentifier, system._id);
		expect(res._id.toString()).to.be.equal(school._id.toString());
	});
});
