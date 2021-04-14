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
});
