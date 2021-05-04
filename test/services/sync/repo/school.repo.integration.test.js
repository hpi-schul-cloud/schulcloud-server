const chai = require('chai');
const { ObjectId } = require('mongoose').Types;
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
	const createdSchools = [];

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	beforeEach(async () => {});

	afterEach(async () => {
		const promises = createdSchools.map((school) => schoolModel.remove(school));
		await Promise.all(promises);
		await testObjects.cleanup();
	});

	after(async () => {
		await server.close();
	});

	it('should successfully create new school', async () => {
		const schoolName = 'Test School';
		const currentYear = new ObjectId();
		const federalStateId = new ObjectId();
		const systemId = new ObjectId();
		const ldapSchoolIDn = 'TEST_LDAP';
		const school = {
			name: schoolName,
			systems: [systemId],
			ldapSchoolIdentifier: ldapSchoolIDn,
			currentYear,
			federalState: federalStateId,
		};
		const res = await SchoolRepo.createSchool(school);
		createdSchools.push(res);
		expect(res._id).to.be.not.undefined;
		expect(res.name).to.be.equal(schoolName);
		expect(res.ldapSchoolIdentifier).to.be.equal(ldapSchoolIDn);
		expect(res.systems[0]._id.toString()).to.be.equal(systemId.toString());
		expect(res.federalState.toString()).to.be.equal(federalStateId.toString());
		expect(res.currentYear.toString()).to.be.equal(currentYear.toString());
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
