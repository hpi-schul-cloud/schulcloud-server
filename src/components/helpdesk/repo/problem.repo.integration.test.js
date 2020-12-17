const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { ObjectId } = require('mongoose').Types;
const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);
const { problemRepo } = require('.');
const problemModel = require('../../../services/helpdesk/model');
const { GeneralError } = require('../../../errors');

chai.use(chaiAsPromised);
const { expect } = chai;

const TEST_PROBLEM_PARAMS = {
	type: 'contactAdmin',
	_id: '5836bb5664582c35df3bc214',
	subject: 'Dies ist ein Titel',
	currentState: 'Dies ist der CurrentState',
	targetState: 'Dies ist der TargetState',
	schoolId: '5836bb5664582c35df3bc000',
};

describe('problem repo', () => {
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

	describe('deleteProblems', () => {
		it('when problem is deleted, it should return deleted problem ids', async () => {
			const user = await testObjects.createTestUser();
			await testObjects.createTestProblem(TEST_PROBLEM_PARAMS, user);
			const result = await problemRepo.deleteProblemsForUser(user._id);
			expect(result.success).to.be.equal(true);
			expect(result.deletedDocuments).to.be.equal(1);
		});

		it('when problem is deleted, it should be gone from db', async () => {
			const user = await testObjects.createTestUser();
			await testObjects.createTestProblem(TEST_PROBLEM_PARAMS, user);
			await problemRepo.deleteProblemsForUser(user._id);

			const result = await problemModel.find({ userId: user._id }).lean().exec();

			expect(result.length).to.be.equal(0);
		});

		it('when the function is called with invalid id, it throws an error', async () => {
			const notExistedId = new ObjectId();
			expect(problemRepo.deleteProblemsForUser(notExistedId)).to.eventually.throw(new GeneralError());
		});
	});

	describe('getProblems', () => {
		it('when the function is called with user id, it should return list of problems ', async () => {
			const user = await testObjects.createTestUser();
			const testProblem = await testObjects.createTestProblem(TEST_PROBLEM_PARAMS, user);
			const problems = await problemRepo.getProblemsForUser(user._id);
			expect(problems[0]._id).to.deep.equal(testProblem._id);
			expect(problems[0].userId).to.deep.equal(user._id);
		});

		it('when the function is called with user id, for which problems dont exist, then it should return empty array', async () => {
			const user = await testObjects.createTestUser();
			const problems = await problemRepo.getProblemsForUser(user._id);
			expect(problems.length).to.be.equal(0);
		});
	});
});
