const sinon = require('sinon');
const { ObjectId } = require('mongoose').Types;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const pseudonymUC = require('./pseudonym.uc');
const { ValidationError } = require('../../../errors');

const { pseudonymRepo } = require('../repo');

const { expect } = chai;
chai.use(chaiAsPromised);

const USER_ID = new ObjectId();
const PSEUDONYM_ID = new ObjectId();
const createTestPseudonym = (userId = USER_ID) => ({
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
		getPseudonymsStub.callsFake((userId = USER_ID) => [createTestPseudonym(userId)]);
	});

	after(async () => {
		getPseudonymsStub.restore();
	});

	describe('deleteUserData', () => {
		it('should recieve a function form use case which resolves in an array', () => {
			expect(pseudonymUC.deleteUserData).to.be.an('function');
			expect(pseudonymUC.deleteUserData()).to.be.an('array').with.length.greaterThan(0);
		});
	});

	describe('deletePseudonymsForUser', () => {
		it('when called with valid user id it should return successful result', async () => {
			const result = await pseudonymUC.deleteUserData()[0](USER_ID);

			expect(result.complete).to.deep.equal(true);
			expect(result.trashBinData).to.be.an('object');
			expect(result.trashBinData.scope).to.be.equal('pseudonyms');
			expect(result.trashBinData.data).to.be.an('array').of.length(1);
			expect(result.trashBinData.data[0]._id.toString()).to.be.equal(PSEUDONYM_ID.toString());
		});

		it('when called with valid user without pseudonyms should return successful result', async () => {
			const USER_WITHOUT_PSEUDONYMS_ID = new ObjectId();

			getPseudonymsStub.callsFake(() => []);
			const result = await pseudonymUC.deleteUserData()[0](USER_WITHOUT_PSEUDONYMS_ID);

			expect(result.complete).to.deep.equal(true);
			expect(result.trashBinData).to.be.an('object');
			expect(result.trashBinData.scope).to.be.equal('pseudonyms');
			expect(result.trashBinData.data).to.be.an('array').of.length(0);
		});

		it('when the function is called with an invalid id, then it fails', async () => {
			expect(pseudonymUC.deleteUserData()[0]('invalid')).to.eventually.be.rejectedWith(ValidationError);
		});
	});
});
