const sinon = require('sinon');
const { ObjectId } = require('mongoose').Types;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const helpdeskUC = require('./helpdesk.uc');
const { ValidationError } = require('../../../errors');

const { problemRepo } = require('../repo');

const { expect } = chai;
chai.use(chaiAsPromised);

const USER_ID = new ObjectId();
const PROBLEM_ID = new ObjectId();
const createTestProblem = (userId = USER_ID) => ({
	_id: PROBLEM_ID,
	type: 'contactAdmin',
	subject: 'Dies ist ein Titel',
	currentState: 'Dies ist der CurrentState',
	targetState: 'Dies ist der TargetState',
	schoolId: '5836bb5664582c35df3bc000',
	userId,
});

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

	describe('deleteUserData', () => {
		it('should recive a function form use case which resolves in an array', () => {
			expect(helpdeskUC.deleteUserData).to.be.an('function');
			expect(helpdeskUC.deleteUserData()).to.be.an('array').with.length.greaterThan(0);
		});
	});

	describe('deleteProblemsForUser', () => {
		it('when called with valid user id it should return successful result', async () => {
			const result = await helpdeskUC.deleteUserData()[0](USER_ID);

			expect(result.complete).to.deep.equal(true);
			expect(result.trashBinData).to.be.an('object');
			expect(result.trashBinData.scope).to.be.equal('problems');
			expect(result.trashBinData.data[0]._id.toString()).to.be.equal(PROBLEM_ID.toString());
		});

		it('when called with valid user without problems should return successful result', async () => {
			const USER_WITHOUT_PROBLEMS_ID = new ObjectId();

			getProblemsStub.callsFake(() => []);
			const result = await helpdeskUC.deleteUserData()[0](USER_WITHOUT_PROBLEMS_ID);

			expect(result.complete).to.deep.equal(true);
			expect(result.trashBinData).to.be.an('object');
			expect(result.trashBinData.scope).to.be.equal('problems');
			expect(result.trashBinData.data.length).to.be.equal(0);
		});

		it('when the function is called with an invalid id, then it fails', async () => {
			const userId = 'NOT_FOUND_USER';
			expect(helpdeskUC.deleteUserData()[0](userId)).to.eventually.throw(ValidationError);
		});
	});
});
