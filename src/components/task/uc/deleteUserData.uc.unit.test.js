const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { ObjectId } = require('mongoose').Types;

// const chaiAsPromised = require('chai-as-promised');
const { deleteUserRelatedData } = require('./deleteUserData.uc');
const repo = require('../repo/task.repo');
const { toString: idToString } = require('../../../helper/compare').ObjectId;
// const testObjects = require('../../../../test/services/helpers/testObjects');

const { expect } = chai;
const mapByName = (deleteUserDataFunctions) =>
	deleteUserDataFunctions.reduce((map, fun) => {
		map[fun.name] = fun;
		return map;
	}, {});

chai.use(chaiAsPromised);

const getExpectedUpdateMany = (modifiedDocuments) => ({ success: true, modifiedDocuments });
const getExpectedDeleteMany = (deletedDocuments) => ({ success: true, deletedDocuments });

const checkExpectedTrashbinResultFormat = (result) => {
	expect(result.complete).to.be.true;
	expect(result.trashBinData).to.be.an('object');
	expect(result.trashBinData).to.haveOwnProperty('scope');
	expect(result.trashBinData).to.haveOwnProperty('data');
};

describe('in "deleteUserData.uc" the function', () => {
	describe('deleteUserData', () => {
		const replaceUserId = new ObjectId();

		// true result
		it('should return a function that return an array.', async () => {
			const result = deleteUserRelatedData();
			expect(result).to.be.an('array').with.lengthOf(5);
			for (const deleteFun of result) {
				expect(deleteFun, 'where first element is a function').to.be.a('function');
			}
		});

		describe('deletePrivateSubmissions', () => {
			beforeEach(() => {
				this.userId = new ObjectId();
				const deleteSingleSubmissionsFromUserStub = sinon.stub(repo, 'deleteSingleSubmissionsFromUser');
				this.privateSubmissions = [
					{ _id: new ObjectId(), studentId: this.userId },
					{ _id: new ObjectId(), studentId: this.userId },
				];
				deleteSingleSubmissionsFromUserStub.withArgs(this.userId).returns(getExpectedDeleteMany(2));

				const findSingleSubmissionIdsByUserStub = sinon.stub(repo, 'findUserSubmissionsByUser');
				findSingleSubmissionIdsByUserStub.callsFake(() => []);
				findSingleSubmissionIdsByUserStub.withArgs(this.userId).returns(this.privateSubmissions);
			});

			afterEach(sinon.restore);

			// true work
			it('should return deleted private submissions', async () => {
				// when
				const { deletePrivateSubmissions } = mapByName(deleteUserRelatedData());
				const result = await deletePrivateSubmissions(this.userId);

				// then
				checkExpectedTrashbinResultFormat(result);
				expect(result.trashBinData.scope).to.be.equal('submissions-private');
				expect(result.trashBinData.data).to.have.members(this.privateSubmissions);
			});

			// user not exist
			it('should return empty data if there is no shared submission', async () => {
				// given
				const otherUserId = new ObjectId();
				// when
				const { deletePrivateSubmissions } = mapByName(deleteUserRelatedData());
				const result = await deletePrivateSubmissions(otherUserId);
				// then
				expect(result.complete).to.be.true;
				expect(result.trashBinData.data).to.be.an('array').that.is.empty;
				expect(result.trashBinData.scope).to.be.equal('submissions-private');
			});
		});

		describe('removeConnectionToSharedSubmissions', () => {
			beforeEach(() => {
				this.userId = new ObjectId();
				const removeGroupSubmissionsConnectionsForUserStub = sinon.stub(
					repo,
					'removeGroupSubmissionsConnectionsForUser'
				);
				this.sharedSubmissions = [
					{ _id: new ObjectId(), teamMembers: this.userId },
					{ _id: new ObjectId(), teamMembers: this.userId },
				];
				removeGroupSubmissionsConnectionsForUserStub.withArgs(this.userId).returns(getExpectedUpdateMany(2));

				const findGroupSubmissionIdsByUserStub = sinon.stub(repo, 'findGroupSubmissionIdsByUser');
				findGroupSubmissionIdsByUserStub.callsFake(() => []);
				findGroupSubmissionIdsByUserStub.withArgs(this.userId).returns(this.sharedSubmissions.map((hw) => hw._id));
			});

			afterEach(sinon.restore);

			// true work
			it('should return shared submissions the user is removed from', async () => {
				// when
				const { removeConnectionToSharedSubmissions } = mapByName(deleteUserRelatedData());
				const result = await removeConnectionToSharedSubmissions(this.userId);

				// then
				checkExpectedTrashbinResultFormat(result);
				expect(result.trashBinData.scope).to.be.equal('submissions-shared');
				expect(result.trashBinData.data.map(idToString)).to.have.members(
					this.sharedSubmissions.map((hw) => idToString(hw._id))
				);
			});

			// user not exist
			it('should return empty data if there is no shared submission', async () => {
				// given
				const otherUserId = new ObjectId();
				// when
				const { removeConnectionToSharedSubmissions } = mapByName(deleteUserRelatedData());
				const result = await removeConnectionToSharedSubmissions(otherUserId);

				// then
				expect(result.complete).to.be.true;
				expect(result.trashBinData.data).to.be.an('array').that.is.empty;
				expect(result.trashBinData.scope).to.be.equal('submissions-shared');
			});
		});

		describe('deletePrivateUserHomeworks', () => {
			beforeEach(() => {
				this.userId = new ObjectId();
				const deletePrivateHomeworksFromUserStub = sinon.stub(repo, 'deletePrivateHomeworksFromUser');
				this.privateHomeworks = [
					{ _id: new ObjectId(), teacherId: this.userId, private: true },
					{ _id: new ObjectId(), teacherId: this.userId, private: true },
				];
				deletePrivateHomeworksFromUserStub.withArgs(this.userId).returns(getExpectedDeleteMany(2));

				const findPrivateHomeworksByUserStub = sinon.stub(repo, 'findPrivateHomeworksByUser');
				findPrivateHomeworksByUserStub.callsFake(() => []);
				findPrivateHomeworksByUserStub.withArgs(this.userId).returns(this.privateHomeworks);
			});

			afterEach(sinon.restore);

			// true work
			it('should return deleted private homeworks', async () => {
				// when
				const { deletePrivateUserHomeworks } = mapByName(deleteUserRelatedData());
				const result = await deletePrivateUserHomeworks(this.userId);
				// then
				checkExpectedTrashbinResultFormat(result);
				expect(result.trashBinData.scope).to.be.equal('homeworks-private');
				expect(result.trashBinData.data).to.have.members(this.privateHomeworks);
			});

			// user not exist
			it('should return empty data if there is no private homeworks', async () => {
				// given
				const otherUserId = new ObjectId();
				// when
				const { deletePrivateUserHomeworks } = mapByName(deleteUserRelatedData());
				const result = await deletePrivateUserHomeworks(otherUserId);
				// then
				expect(result.complete).to.be.true;
				expect(result.trashBinData.data).to.be.an('array').that.is.empty;
				expect(result.trashBinData.scope).to.be.equal('homeworks-private');
			});
		});

		describe('removeConnectionToSharedHomeworks', () => {
			beforeEach(() => {
				this.userId = new ObjectId();
				const replaceUserInPublicHomeworksStub = sinon.stub(repo, 'replaceUserInPublicHomeworks');
				this.sharedHomeworks = [
					{ _id: new ObjectId(), teacherId: this.userId, private: false },
					{ _id: new ObjectId(), teacherId: this.userId, private: false },
				];
				replaceUserInPublicHomeworksStub.withArgs(this.userId, replaceUserId).returns(getExpectedUpdateMany(2));

				const findPublicHomeworkIdsByUserStub = sinon.stub(repo, 'findPublicHomeworkIdsByUser');
				findPublicHomeworkIdsByUserStub.callsFake(() => []);
				findPublicHomeworkIdsByUserStub.withArgs(this.userId).returns(this.sharedHomeworks.map((hw) => hw._id));
			});

			afterEach(sinon.restore);

			// true work
			it('should return shared homework ids the user is removed from', async () => {
				// when
				const { removeConnectionToSharedHomeworks } = mapByName(deleteUserRelatedData());
				const result = await removeConnectionToSharedHomeworks(this.userId, replaceUserId);

				// then
				checkExpectedTrashbinResultFormat(result);
				expect(result.trashBinData.scope).to.be.equal('homeworks-shared');
				expect(result.trashBinData.data.map(idToString)).to.have.members(
					this.sharedHomeworks.map((hw) => idToString(hw._id))
				);
			});

			// user not exist
			it('should return empty data if there is no shared homeworks', async () => {
				// given
				const otherUserId = new ObjectId();
				// when
				const { removeConnectionToSharedHomeworks } = mapByName(deleteUserRelatedData());
				const result = await removeConnectionToSharedHomeworks(otherUserId, replaceUserId);
				// then
				expect(result.complete).to.be.true;
				expect(result.trashBinData.data).to.be.an('array').that.is.empty;
				expect(result.trashBinData.scope).to.be.equal('homeworks-shared');
			});
		});

		describe('removeConnectionToArchivedHomeworks', () => {
			beforeEach(() => {
				this.userId = new ObjectId();
				const replaceUserInArchivedHomeworksStub = sinon.stub(repo, 'removeUserInArchivedHomeworks');
				this.archivedHomeworks = [
					{ _id: new ObjectId(), archived: this.userId },
					{ _id: new ObjectId(), archived: this.userId },
				];
				replaceUserInArchivedHomeworksStub.withArgs(this.userId).returns(getExpectedUpdateMany(2));

				const findArchivedHomeworkIdsByUserStub = sinon.stub(repo, 'findArchivedHomeworkIdsByUser');
				findArchivedHomeworkIdsByUserStub.callsFake(() => []);
				findArchivedHomeworkIdsByUserStub.withArgs(this.userId).returns(this.archivedHomeworks.map((hw) => hw._id));
			});

			afterEach(sinon.restore);

			// true work
			it('should return updated archived submissions', async () => {
				// when
				const { removeConnectionToArchivedHomeworks } = mapByName(deleteUserRelatedData());
				const result = await removeConnectionToArchivedHomeworks(this.userId);

				// then
				checkExpectedTrashbinResultFormat(result);
				expect(result.trashBinData.scope).to.be.equal('homeworks-archived');
				expect(result.trashBinData.data.map(idToString)).to.have.members(
					this.archivedHomeworks.map((hw) => idToString(hw._id))
				);
			});

			// user not exist
			it('should return empty data if not archived submissions', async () => {
				// given
				const otherUserId = new ObjectId();
				// when
				const { removeConnectionToArchivedHomeworks } = mapByName(deleteUserRelatedData());
				const result = await removeConnectionToArchivedHomeworks(otherUserId);

				// then
				expect(result.complete).to.be.true;
				expect(result.trashBinData.data).to.be.an('array').that.is.empty;
				expect(result.trashBinData.scope).to.be.equal('homeworks-archived');
			});
		});
	});
});
