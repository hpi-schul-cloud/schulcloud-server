const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { ObjectId } = require('mongoose').Types;
const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);
const { problemRepo } = require('.');
const { GeneralError, ValidationError } = require('../../../errors');

chai.use(chaiAsPromised);
const { expect } = chai;

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
			const userId = user._id;
			await testObjects.createTestProblem({ userId });
			const result = await problemRepo.deleteProblemsForUser(userId);
			expect(result.success).to.be.equal(true);
			expect(result.deletedDocuments).to.be.equal(1);
		});

		it('when problem is deleted, it should be gone from db', async () => {
			const user = await testObjects.createTestUser();
			const userId = user._id;
			await testObjects.createTestProblem({ userId });

			const user2 = await testObjects.createTestUser();
			const userId2 = user2._id;
			await testObjects.createTestProblem({ userId: userId2 });
			let userProblems = await problemRepo.getProblemsForUser(userId);
			expect(userProblems).to.be.an('array').of.length(1);
			expect(userProblems[0]._id.toString()).to.be.equal(problemUser1._id.toString());	
			await problemRepo.deleteProblemsForUser(userId);

			userProblems = await problemRepo.getProblemsForUser(userId);
			expect(userProblems).to.be.an('array').of.length(0);

			const userProblems2 = await problemRepo.getProblemsForUser(userId2);
			expect(userProblems2).to.be.an('array').of.length(1);
			expect(userProblems2[0]._id.toString()).to.be.equal(problemUser2._id.toString());
		});

		it('when the function is called with invalid id, it throws an error', async () => {
			const notExistedId = new ObjectId();
			expect(problemRepo.deleteProblemsForUser(notExistedId)).to.eventually.throw(GeneralError);
		});
	});

	describe('getProblemsForUser', () => {
		it('when the function is called with user id, it should return list of problems ', async () => {
			const user = await testObjects.createTestUser();
			const userId = user._id;
			const testProblem = await testObjects.createTestProblem({ userId });
			const problems = await problemRepo.getProblemsForUser(userId);
			expect(problems[0]._id).to.deep.equal(testProblem._id);
			expect(problems[0].userId).to.deep.equal(userId);
		});

		it('when the function is called with user id, for which problems dont exist, then it should return empty array', async () => {
			const user = await testObjects.createTestUser();

			const user2 = await testObjects.createTestUser();
			const userId2 = user2._id;
			await testObjects.createTestProblem({ userId: userId2 });

			const problems = await problemRepo.getProblemsForUser(user._id);
			expect(problems.length).to.be.equal(0);
		});

		it('when the function is called with invalid user id, it should return an error', async () => {
			expect(problemRepo.getProblemsForUser('INVALID_USER_ID')).to.eventually.throw(ValidationError);
		});
	});
});
