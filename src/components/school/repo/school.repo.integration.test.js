const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);
const schoolRepo = require('./school.repo');
const { SCHOOL_OF_DELETED_USERS } = require('./db');

chai.use(chaiAsPromised);
const { expect } = chai;

describe('school repository', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	after(async () => {
		await server.close();
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});

	describe('getSchool', () => {
		it('should return school if school with given id exists', async () => {
			const school = await testObjects.createTestSchool();

			const result = await schoolRepo.getSchool(school._id);

			expect(result).to.eql(school);
		});

		it('should return null if school with given id does not exist', async () => {
			const notExistingId = testObjects.generateObjectId();
			const school = await schoolRepo.getSchool(notExistingId);
			expect(school).to.be.null;
		});
	});

	describe('getTombstoneSchool', () => {
		it('should return tombstone school', async () => {
			const result = await schoolRepo.getTombstoneSchool();

			expect(result.purpose).to.be.equal(SCHOOL_OF_DELETED_USERS.purpose);
			expect(result.name).to.be.equal(SCHOOL_OF_DELETED_USERS.name);
		});
	});

	describe('setTombstoneUser', () => {
		it('should update schools by id with tombstone user', async () => {
			const school = await testObjects.createTestSchool();
			const tombstoneUser = await testObjects.createTestUser();
			const expectedSchool = { ...school, tombstoneUserId: tombstoneUser._id };
			delete expectedSchool.updatedAt;

			const updatedSchool = await schoolRepo.setTombstoneUser(school._id, tombstoneUser._id);
			delete updatedSchool.updatedAt;
			expect(updatedSchool).to.deep.equal(expectedSchool);
		});
	});

	describe('create', () => {
		it('should successfully create new school', async () => {
			const schoolName = 'Test School';
			const res = await schoolRepo.create({ name: schoolName });
			expect(res._id).to.be.not.undefined;
			expect(res.name).to.be.equal(schoolName);

			await schoolRepo.remove(res);
		});
	});

	describe('update', () => {
		it('should successfully update school name', async () => {
			const schoolName = 'New Test School';
			const school = await testObjects.createTestSchool({});
			const res = await schoolRepo.updateName(school._id, schoolName);
			expect(res.name).to.be.equal(schoolName);
		});
	});

	describe('find by ldap and system', async () => {
		it('should find school by ldap and system', async () => {
			const ldapSchoolIdentifier = 'LDAP_ID';
			const system = await testObjects.createTestSystem();
			const school = await testObjects.createTestSchool({ ldapSchoolIdentifier, systems: [system._id] });
			const res = await schoolRepo.findByLdapIdAndSystem(ldapSchoolIdentifier, system._id);
			expect(res._id.toString()).to.be.equal(school._id.toString());
		});
	});
});
