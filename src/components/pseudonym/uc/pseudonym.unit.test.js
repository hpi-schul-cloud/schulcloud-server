const sinon = require('sinon');
const { ObjectId } = require('mongoose').Types;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const pseudonymUC = require('./pseudonym.uc');
const { AssertionError } = require('../../../errors');

const { pseudonymRepo } = require('../repo');

const { expect } = chai;
chai.use(chaiAsPromised);

const USER_ID = new ObjectId();
const PSEUDONYM_ID = new ObjectId();
const getPseudonymsForUserStub = (userId = USER_ID) => ({
	_id: PSEUDONYM_ID,
	toolId: new ObjectId(),
	pseudonym: 'PSEUDONYM',
	userId,
});

let getPseudonymsStub;

describe('pseudonym usecase', () => {
	before(async () => {
		// init stubs
		getPseudonymsStub = sinon.stub(pseudonymRepo, 'getPseudonymsForUser');
		getPseudonymsStub.callsFake((userId = USER_ID) => [getPseudonymsForUserStub(userId)]);
	});

	after(async () => {
		getPseudonymsStub.restore();
	});

	const getPseudonymDeletionResult = async (userId) => {
		const deletionSteps = pseudonymUC.deleteUserData;
		const deletionResults = deletionSteps.map((step) => step(userId));
		const result = await Promise.all(deletionResults);

		return result.find((r) => r.trashBinData.scope === 'pseudonyms');
	};

	describe('deleteUserData', () => {
		it('should recieve an array of functions form use case', () => {
			expect(pseudonymUC.deleteUserData).to.be.an('array').with.length.greaterThan(0);
			expect(pseudonymUC.deleteUserData[0]).to.be.an('function');
		});
	});

	describe('deletePseudonymsForUser', () => {
		it('when called with valid user id it should return successful result', async () => {
			const result = await getPseudonymDeletionResult(USER_ID);

			expect(result.complete).to.deep.equal(true);
			expect(result.trashBinData).to.be.an('object');
			expect(result.trashBinData.scope).to.be.equal('pseudonyms');
			expect(result.trashBinData.data).to.be.an('array').of.length(1);
			expect(result.trashBinData.data[0]._id.toString()).to.be.equal(PSEUDONYM_ID.toString());
		});

		it('when called with valid user without pseudonyms should return successful result', async () => {
			getPseudonymsStub.callsFake(() => []);

			const pseudonymResult = await getPseudonymDeletionResult(USER_ID);
			expect(pseudonymResult.complete).to.deep.equal(true);
			expect(pseudonymResult.trashBinData).to.be.an('object');
			expect(pseudonymResult.trashBinData.scope).to.be.equal('pseudonyms');
			expect(pseudonymResult.trashBinData.data).to.be.an('array').of.length(0);
		});

		it('when the function is called with an invalid id, then it fails', async () => {
			await expect(getPseudonymDeletionResult('invalid')).to.be.rejectedWith(AssertionError);
		});
	});
});
