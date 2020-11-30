const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { ObjectId } = require('mongoose').Types;
const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);
const { pseudonymRepo } = require('.');
const Pseudonym = require('../../../services/pseudonym/model');
const { GeneralError } = require('../../../errors');

chai.use(chaiAsPromised);
const { expect } = chai;

describe('pseudonym repo', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});

	after(async () => {
		await server.close();
	});

	describe('deletePseudonyms', () => {
		it('when pseudonym is deleted, it should return deleted pseudonym ids', async () => {
			const user = await testObjects.createTestUser();
			const ltiTool = await testObjects.createTestLtiTool();
			const pseudonym = await testObjects.createTestPseudonym({ pseudonym: 'PSEUDONYM' }, ltiTool, user);
			const result = await pseudonymRepo.deletePseudonyms([pseudonym._id]);
			expect(result.length).to.be.equal(1);
			expect(result[0]).to.be.equal(pseudonym._id);
		});

		it('when pseudonym is deleted, it should be gone from db', async () => {
			const user = await testObjects.createTestUser();
			const ltiTool = await testObjects.createTestLtiTool();
			const pseudonym = await testObjects.createTestPseudonym({ pseudonym: 'PSEUDONYM' }, ltiTool, user);
			await pseudonymRepo.deletePseudonyms([pseudonym._id]);

			const result = await Pseudonym.find({ userId: user._id }).lean().exec();

			expect(result.length).to.be.equal(0);
		});

		it('when the function is called with invalid id, it throws an error', async () => {
			const notExistedId = new ObjectId();
			expect(pseudonymRepo.deletePseudonyms([notExistedId])).to.eventually.throw(new GeneralError());
		});
	});

	describe('getPseudonyms', () => {
		it('when the function is called with user id, it should return list of pseudonyms ', async () => {
			const user = await testObjects.createTestUser();
			const ltiTool = await testObjects.createTestLtiTool();
			const testPseudonym = await testObjects.createTestPseudonym({ pseudonym: 'PSEUDONYM' }, ltiTool, user);
			const pseudonyms = await pseudonymRepo.getPseudonymsForUser(user._id);
			expect(pseudonyms[0]._id).to.deep.equal(testPseudonym._id);
			expect(pseudonyms[0].userId).to.deep.equal(user._id);
		});

		it('when the function is called with user id, for which pseudonyms dont exist, then it should return empty array', async () => {
			const user = await testObjects.createTestUser();
			const pseudonyms = await pseudonymRepo.getPseudonymsForUser(user._id);
			expect(pseudonyms.length).to.be.equal(0);
		});
	});
});
