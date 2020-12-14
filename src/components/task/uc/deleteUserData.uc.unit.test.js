const sinon = require('sinon');
const chai = require('chai');
const { ObjectId } = require('mongoose').Types;

// const chaiAsPromised = require('chai-as-promised');
const { deleteUserData } = require('./deleteUserData.uc');
const repo = require('../repo/task.repo');
// const testObjects = require('../../../../test/services/helpers/testObjects');

const { expect } = chai;

describe('in "deleteUserData.uc" the function', () => {
	describe('deleteUserData', () => {
		const undefinedInput = undefined;
		const notExistingUserId = new ObjectId();
		const userId = new ObjectId();
		const userNotDefinedError = new Error('The parameter "userId" is not defined.', undefined);

		before(() => {
			/** homework operations */
			const findPrivateHomeworksFromUserStub = sinon.stub(repo, 'findPrivateHomeworksFromUser');
			findPrivateHomeworksFromUserStub.withArgs(undefinedInput).returns([]);
			findPrivateHomeworksFromUserStub.withArgs(notExistingUserId).returns([]);
			findPrivateHomeworksFromUserStub.withArgs(userId).returns([
				{ _id: new ObjectId(), teacherId: userId, private: true },
				{ _id: new ObjectId(), teacherId: userId, private: true },
			]);

			const findPublicHomeworksFromUserStub = sinon.stub(repo, 'findPublicHomeworksFromUser');
			findPublicHomeworksFromUserStub.withArgs(undefinedInput).returns([]);
			findPublicHomeworksFromUserStub.withArgs(notExistingUserId).returns([]);
			findPublicHomeworksFromUserStub.withArgs(userId).returns([{ _id: new ObjectId() }, { _id: new ObjectId() }]);

			const deletePrivateHomeworksFromUserStub = sinon.stub(repo, 'deletePrivateHomeworksFromUser');
			deletePrivateHomeworksFromUserStub.withArgs(undefinedInput).throws(userNotDefinedError);
			deletePrivateHomeworksFromUserStub.withArgs(notExistingUserId).returns({ success: 1, modified: 0 });
			deletePrivateHomeworksFromUserStub.withArgs(userId).returns({ success: 1, modified: 2 });

			const replaceUserInPublicHomeworksStub = sinon.stub(repo, 'replaceUserInPublicHomeworks');
			replaceUserInPublicHomeworksStub.withArgs(undefinedInput).throws(userNotDefinedError);
			replaceUserInPublicHomeworksStub.withArgs(notExistingUserId).returns({ success: 1, modified: 0 });
			replaceUserInPublicHomeworksStub.withArgs(userId).returns({ success: 1, modified: 2 });

			/** submission operations */
			const findSingleSubmissionsFromUserStub = sinon.stub(repo, 'findSingleSubmissionsFromUser');
			findSingleSubmissionsFromUserStub.withArgs(undefinedInput).returns([]);
			findSingleSubmissionsFromUserStub.withArgs(notExistingUserId).returns([]);
			findSingleSubmissionsFromUserStub.withArgs(userId).returns([
				{ _id: new ObjectId(), studentId: userId, teamMembers: null },
				{ _id: new ObjectId(), studentId: userId, teamMembers: null },
			]);

			const findGroupSubmissionsFromUserStub = sinon.stub(repo, 'findGroupSubmissionsFromUser');
			findGroupSubmissionsFromUserStub.withArgs(undefinedInput).returns([]);
			findGroupSubmissionsFromUserStub.withArgs(notExistingUserId).returns([]);
			findGroupSubmissionsFromUserStub.withArgs(userId).returns([{ _id: new ObjectId() }, { _id: new ObjectId() }]);

			const removeGroupSubmissionsConnectionsForUserStub = sinon.stub(repo, 'removeGroupSubmissionsConnectionsForUser');
			removeGroupSubmissionsConnectionsForUserStub.withArgs(undefinedInput).throws(userNotDefinedError);
			removeGroupSubmissionsConnectionsForUserStub.withArgs(notExistingUserId).returns({ success: 1, modified: 0 });
			removeGroupSubmissionsConnectionsForUserStub.withArgs(userId).returns({ success: 1, modified: 2 });

			const deleteSingleSubmissionsFromUserStub = sinon.stub(repo, 'deleteSingleSubmissionsFromUser');
			deleteSingleSubmissionsFromUserStub.withArgs(undefinedInput).throws(userNotDefinedError);
			deleteSingleSubmissionsFromUserStub.withArgs(notExistingUserId).returns({ success: 1, modified: 0 });
			deleteSingleSubmissionsFromUserStub.withArgs(userId).returns({ success: 1, modified: 2 });
		});
		// true result
		it('should return a function that return an array.', async () => {
			const result = deleteUserData();
			expect(result).to.be.an('array').with.lengthOf(4);
			expect(result[0], 'where first element is a function').to.be.a('function');
			expect(result[1], 'where second element is a function').to.be.a('function');
			expect(result[2], 'where third element is a function').to.be.a('function');
			expect(result[3], 'where fourth element is a function').to.be.a('function');
		});

		// true work
		it('should ...', () => {

		});


		// wrong first parameter input

		// wrong second parameter input (?)

		// user not exist

		// repo throw error

		// if length =< 0
	});
});
