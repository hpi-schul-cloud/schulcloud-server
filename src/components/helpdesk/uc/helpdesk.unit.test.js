const sinon = require('sinon');
const { ObjectId } = require('mongoose').Types;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const helpdeskUC = require('./helpdesk.uc');

const { problemRepo } = require('../repo');

const { expect } = chai;
chai.use(chaiAsPromised);

const USER_ID = 'USER_ID';

const createTestProblem = (userId = USER_ID) => {
	return {
		_id: 'PROBLEM_ID',
		type: 'contactAdmin',
		subject: 'Dies ist ein Titel',
		currentState: 'Dies ist der CurrentState',
		targetState: 'Dies ist der TargetState',
		schoolId: '5836bb5664582c35df3bc000',
		userId,
	};
};

let getProblemsStub;

describe('helpdesk usecase', () => {
	before(async () => {
		// init stubs
		getProblemsStub = sinon.stub(problemRepo, 'getProblemsForUser');
		getProblemsStub.callsFake((userId = USER_ID) => [createTestProblem(userId)]);
	});

	after(async () => {
		getProblemsStub.restore();
	});

	describe('deleteProblemsForUser', () => {
		it('when an authorized admin calls the function, it succeeds', async () => {
			const userId = new ObjectId();
			const result = await helpdeskUC.deleteProblemsForUser(userId);

			expect(result.complete).to.deep.equal(true);
			expect(result.trashBinData).to.be.an('object');
			expect(result.trashBinData.scope).to.be.equal('problems');
			expect(result.trashBinData.data.length).to.be.equal(1);
		});

		it('when the function is called with an invalid id, then it fails', async () => {
			const userId = 'NOT_FOUND_USER';
			expect(() => helpdeskUC.deleteProblemsForUser(userId), "if user wasn't found it should fail").to.throw;
		});
	});
});
