const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);
const { pseudonymRepo } = require('.');
const { ValidationError } = require('../../../errors');

chai.use(chaiAsPromised);
const { expect } = chai;

describe('pseudonym repo', () => {
	let app;
	let server;
	let ltiTool;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	beforeEach(async () => {
		ltiTool = await testObjects.createTestLtiTool();
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});

	after(async () => {
		await server.close();
	});

	describe('deletePseudonyms', () => {
		it('when pseudonym is deleted, it should return the amount of deleted values', async () => {
			const user = await testObjects.createTestUser();
			await testObjects.createTestPseudonym({}, ltiTool, user);
			const result = await pseudonymRepo.deletePseudonymsForUser(user._id);
			expect(result.success).to.be.equal(true);
			expect(result.deletedDocuments).to.be.equal(1);
		});

		it('when pseudonym is deleted, it should be gone from db', async () => {
			const user = await testObjects.createTestUser();
			const pseudonym1 = await testObjects.createTestPseudonym({}, ltiTool, user);

			const user2 = await testObjects.createTestUser();
			const pseudonym2 = await testObjects.createTestPseudonym({}, ltiTool, user2);
			let userPseudonyms = await pseudonymRepo.getPseudonymsForUser(user._id);
			expect(userPseudonyms).to.be.an('array').of.length(1);
			expect(userPseudonyms[0]._id.toString()).to.be.equal(pseudonym1._id.toString());

			await pseudonymRepo.deletePseudonymsForUser(user._id);

			userPseudonyms = await pseudonymRepo.getPseudonymsForUser(user._id);
			expect(userPseudonyms).to.be.an('array').of.length(0);

			const userPseudonyms2 = await pseudonymRepo.getPseudonymsForUser(user2._id);
			expect(userPseudonyms2).to.be.an('array').of.length(1);
			expect(userPseudonyms2[0]._id.toString()).to.be.equal(pseudonym2._id.toString());
		});

		it('when the function is called with invalid id, it throws an error', async () => {
			expect(pseudonymRepo.deletePseudonymsForUser('invalid')).to.eventually.be.rejectedWith(ValidationError);
		});
	});

	describe('getPseudonymsForUser', () => {
		it('when the function is called with user id, it should return list of pseudonyms ', async () => {
			const user = await testObjects.createTestUser();
			const testPseudonym = await testObjects.createTestPseudonym({ pseudonym: 'PSEUDONYM' }, ltiTool, user);
			const pseudonyms = await pseudonymRepo.getPseudonymsForUser(user._id);
			expect(pseudonyms).to.be.an('array').of.length(1);
			expect(pseudonyms[0]._id).to.deep.equal(testPseudonym._id);
			expect(pseudonyms[0].userId).to.deep.equal(user._id);
		});

		it('when the function is called with user id, for which pseudonyms dont exist, then it should return empty array', async () => {
			const user = await testObjects.createTestUser();

			const user2 = await testObjects.createTestUser();
			await testObjects.createTestPseudonym({ pseudonym: 'PSEUDONYM' }, ltiTool, user2._id);

			const pseudonyms = await pseudonymRepo.getPseudonymsForUser(user._id);
			expect(pseudonyms.length).to.be.equal(0);
		});

		it('when the function is called with invalid user id, it should return an error', async () => {
			expect(pseudonymRepo.getPseudonymsForUser('INVALID_USER_ID')).to.eventually.be.rejectedWith(ValidationError);
		});
	});
});
