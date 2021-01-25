const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { ObjectId } = require('mongoose').Types;

// const chaiAsPromised = require('chai-as-promised');
const { deleteUserRelatedData } = require('./deleteUserData.uc');
const repo = require('../repo/task.repo');
const { equal, toString: idToString } = require('../../../helper/compare').ObjectId;
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

describe('in "deleteUserData.uc" the function', () => {
	describe('deleteUserData', () => {
		const notExistingUserId = new ObjectId();
		const userId = new ObjectId();
		const replaceUserId = new ObjectId();

		// true result
		it('should return a function that return an array.', async () => {
			const result = deleteUserRelatedData();
			expect(result).to.be.an('array').with.lengthOf(5);
			expect(result[0], 'where first element is a function').to.be.a('function');
			expect(result[1], 'where second element is a function').to.be.a('function');
			expect(result[2], 'where third element is a function').to.be.a('function');
			expect(result[3], 'where fourth element is a function').to.be.a('function');
			expect(result[4], 'where fourth element is a function').to.be.a('function');
		});

		describe('deletePrivateSubmissions', () => {
			const initStubs = ({ studentId }) => {
				const deleteSingleSubmissionsFromUserStub = sinon.stub(repo, 'deleteSingleSubmissionsFromUser');
				const privateSubmissions = [
					{ _id: new ObjectId(), studentId },
					{ _id: new ObjectId(), studentId },
				];
				deleteSingleSubmissionsFromUserStub.withArgs(userId).returns(getExpectedDeleteMany(2));

				const findSingleSubmissionIdsByUserStub = sinon.stub(repo, 'findSingleSubmissionsByUser');
				findSingleSubmissionIdsByUserStub.callsFake(() => []);
				findSingleSubmissionIdsByUserStub.withArgs(userId).returns(privateSubmissions);

				return { findSingleSubmissionIdsByUserStub, deleteSingleSubmissionsFromUserStub, privateSubmissions };
			};

			// true work
			it('should return deleted private submissions', async () => {
				// given
				const {
					findSingleSubmissionIdsByUserStub,
					deleteSingleSubmissionsFromUserStub,
					privateSubmissions,
				} = initStubs({
					studentId: userId,
				});
				// when
				const { deletePrivateSubmissions } = mapByName(deleteUserRelatedData());
				const result = await deletePrivateSubmissions(userId);
				findSingleSubmissionIdsByUserStub.restore();
				deleteSingleSubmissionsFromUserStub.restore();
				// then
				expect(result.complete).to.be.true;
				expect(result.trashBinData).to.be.an('object');
				expect(result.trashBinData).to.haveOwnProperty('scope');
				expect(result.trashBinData).to.haveOwnProperty('data');
				expect(result.trashBinData.scope).to.be.equal('submissions-private');
				expect(result.trashBinData.data.map((sm) => idToString(sm._id))).to.have.members(
					privateSubmissions.map((hw) => idToString(hw._id))
				);
			});

			// user not exist
			it('should return empty data if there is no shared submission', async () => {
				// given
				const otherUserId = new ObjectId();
				const { findSingleSubmissionIdsByUserStub, deleteSingleSubmissionsFromUserStub } = initStubs({
					studentId: userId,
				});
				// when
				const { deletePrivateSubmissions } = mapByName(deleteUserRelatedData());
				const result = await deletePrivateSubmissions(otherUserId);
				findSingleSubmissionIdsByUserStub.restore();
				deleteSingleSubmissionsFromUserStub.restore();
				// then
				expect(result.complete).to.be.true;
				expect(result.trashBinData.data).to.be.an('array').that.is.empty;
				expect(result.trashBinData.scope).to.be.equal('submissions-private');
			});
		});

		describe('removeConnectionToSharedSubmissions', () => {
			const initStubs = ({ teamMember }) => {
				const removeGroupSubmissionsConnectionsForUserStub = sinon.stub(
					repo,
					'removeGroupSubmissionsConnectionsForUser'
				);
				const sharedSubmissions = [
					{ _id: new ObjectId(), teamMembers: teamMember },
					{ _id: new ObjectId(), teamMembers: teamMember },
				];
				removeGroupSubmissionsConnectionsForUserStub.withArgs(userId).returns(getExpectedUpdateMany(2));

				const findGroupSubmissionIdsByUserStub = sinon.stub(repo, 'findGroupSubmissionIdsByUser');
				findGroupSubmissionIdsByUserStub.callsFake(() => []);
				findGroupSubmissionIdsByUserStub.withArgs(userId).returns(sharedSubmissions.map((hw) => hw._id));

				return { findGroupSubmissionIdsByUserStub, removeGroupSubmissionsConnectionsForUserStub, sharedSubmissions };
			};

			// true work
			it('should return shared submissions the user is removed from', async () => {
				// given
				const {
					findGroupSubmissionIdsByUserStub,
					removeGroupSubmissionsConnectionsForUserStub,
					sharedSubmissions,
				} = initStubs({
					teamMember: userId,
				});
				// when
				const { removeConnectionToSharedSubmissions } = mapByName(deleteUserRelatedData());
				const result = await removeConnectionToSharedSubmissions(userId);
				findGroupSubmissionIdsByUserStub.restore();
				removeGroupSubmissionsConnectionsForUserStub.restore();
				// then
				expect(result.complete).to.be.true;
				expect(result.trashBinData).to.be.an('object');
				expect(result.trashBinData).to.haveOwnProperty('scope');
				expect(result.trashBinData).to.haveOwnProperty('data');
				expect(result.trashBinData.scope).to.be.equal('submissions-shared');
				expect(result.trashBinData.data.map(idToString)).to.have.members(
					sharedSubmissions.map((hw) => idToString(hw._id))
				);
			});

			// user not exist
			it('should return empty data if there is no shared submission', async () => {
				// given
				const otherUserId = new ObjectId();
				const { findGroupSubmissionIdsByUserStub, removeGroupSubmissionsConnectionsForUserStub } = initStubs({
					teamMember: userId,
				});
				// when
				const { removeConnectionToSharedSubmissions } = mapByName(deleteUserRelatedData());
				const result = await removeConnectionToSharedSubmissions(otherUserId);
				findGroupSubmissionIdsByUserStub.restore();
				removeGroupSubmissionsConnectionsForUserStub.restore();
				// then
				expect(result.complete).to.be.true;
				expect(result.trashBinData.data).to.be.an('array').that.is.empty;
				expect(result.trashBinData.scope).to.be.equal('submissions-shared');
			});
		});

		describe('deletePrivateUserHomeworks', () => {
			const initStubs = ({ teacherId }) => {
				const deletePrivateHomeworksFromUserStub = sinon.stub(repo, 'deletePrivateHomeworksFromUser');
				const privateHomeworks = [
					{ _id: new ObjectId(), teacherId, private: true },
					{ _id: new ObjectId(), teacherId, private: true },
				];
				deletePrivateHomeworksFromUserStub.withArgs(userId).returns(getExpectedDeleteMany(2));

				const findPrivateHomeworksByUserStub = sinon.stub(repo, 'findPrivateHomeworksByUser');
				findPrivateHomeworksByUserStub.callsFake(() => []);
				findPrivateHomeworksByUserStub.withArgs(userId).returns(privateHomeworks);

				return { findPrivateHomeworksByUserStub, deletePrivateHomeworksFromUserStub, privateHomeworks };
			};

			// true work
			it('should return deleted private homeworks', async () => {
				// given
				const { findPrivateHomeworksByUserStub, deletePrivateHomeworksFromUserStub, privateHomeworks } = initStubs({
					teacherId: userId,
				});
				// when
				const { deletePrivateUserHomeworks } = mapByName(deleteUserRelatedData());
				const result = await deletePrivateUserHomeworks(userId);
				findPrivateHomeworksByUserStub.restore();
				deletePrivateHomeworksFromUserStub.restore();
				// then
				expect(result.complete).to.be.true;
				expect(result.trashBinData).to.be.an('object');
				expect(result.trashBinData).to.haveOwnProperty('scope');
				expect(result.trashBinData).to.haveOwnProperty('data');
				expect(result.trashBinData.scope).to.be.equal('homeworks-private');
				expect(result.trashBinData.data.map((hw) => idToString(hw._id))).to.have.members(
					privateHomeworks.map((hw) => idToString(hw._id))
				);
			});

			// user not exist
			it('should return empty data if there is no private homeworks', async () => {
				// given
				const otherUserId = new ObjectId();
				const { findPrivateHomeworksByUserStub, deletePrivateHomeworksFromUserStub } = initStubs({
					teacherId: userId,
				});
				// when
				const { deletePrivateUserHomeworks } = mapByName(deleteUserRelatedData());
				const result = await deletePrivateUserHomeworks(otherUserId);
				findPrivateHomeworksByUserStub.restore();
				deletePrivateHomeworksFromUserStub.restore();
				// then
				expect(result.complete).to.be.true;
				expect(result.trashBinData.data).to.be.an('array').that.is.empty;
				expect(result.trashBinData.scope).to.be.equal('homeworks-private');
			});
		});

		describe('removeConnectionToSharedHomeworks', () => {
			const initStubs = ({ teacherId }) => {
				const replaceUserInPublicHomeworksStub = sinon.stub(repo, 'replaceUserInPublicHomeworks');
				const sharedHomeworks = [
					{ _id: new ObjectId(), teacherId, private: false },
					{ _id: new ObjectId(), teacherId, private: false },
				];
				replaceUserInPublicHomeworksStub.withArgs(userId, replaceUserId).returns(getExpectedUpdateMany(2));

				const findPublicHomeworkIdsByUserStub = sinon.stub(repo, 'findPublicHomeworkIdsByUser');
				findPublicHomeworkIdsByUserStub.callsFake(() => []);
				findPublicHomeworkIdsByUserStub.withArgs(userId).returns(sharedHomeworks.map((hw) => hw._id));

				return { findPublicHomeworkIdsByUserStub, replaceUserInPublicHomeworksStub, sharedHomeworks };
			};

			// true work
			it('should return shared homework ids the user is removed from', async () => {
				// given
				const { findPublicHomeworkIdsByUserStub, replaceUserInPublicHomeworksStub, sharedHomeworks } = initStubs({
					teacherId: userId,
				});
				// when
				const { removeConnectionToSharedHomeworks } = mapByName(deleteUserRelatedData());
				const result = await removeConnectionToSharedHomeworks(userId, replaceUserId);
				findPublicHomeworkIdsByUserStub.restore();
				replaceUserInPublicHomeworksStub.restore();
				// then
				expect(result.complete).to.be.true;
				expect(result.trashBinData).to.be.an('object');
				expect(result.trashBinData).to.haveOwnProperty('scope');
				expect(result.trashBinData).to.haveOwnProperty('data');
				expect(result.trashBinData.scope).to.be.equal('homeworks-shared');
				expect(result.trashBinData.data.map(idToString)).to.have.members(
					sharedHomeworks.map((hw) => idToString(hw._id))
				);
			});

			// user not exist
			it('should return empty data if there is no shared homeworks', async () => {
				// given
				const otherUserId = new ObjectId();
				const { findPublicHomeworkIdsByUserStub, replaceUserInPublicHomeworksStub } = initStubs({
					teacherId: userId,
				});
				// when
				const { removeConnectionToSharedHomeworks } = mapByName(deleteUserRelatedData());
				const result = await removeConnectionToSharedHomeworks(otherUserId, replaceUserId);
				findPublicHomeworkIdsByUserStub.restore();
				replaceUserInPublicHomeworksStub.restore();
				// then
				expect(result.complete).to.be.true;
				expect(result.trashBinData.data).to.be.an('array').that.is.empty;
				expect(result.trashBinData.scope).to.be.equal('homeworks-shared');
			});
		});

		describe('removeConnectionToArchivedHomeworks', () => {
			const initStubs = ({ archived }) => {
				const replaceUserInArchivedHomeworksStub = sinon.stub(repo, 'replaceUserInArchivedHomeworks');
				const archivedHomeworks = [
					{ _id: new ObjectId(), archived },
					{ _id: new ObjectId(), archived },
				];
				replaceUserInArchivedHomeworksStub.withArgs(userId, replaceUserId).returns(getExpectedUpdateMany(2));

				const findArchivedHomeworkIdsByUserStub = sinon.stub(repo, 'findArchivedHomeworkIdsByUser');
				findArchivedHomeworkIdsByUserStub.callsFake(() => []);
				findArchivedHomeworkIdsByUserStub.withArgs(userId).returns(archivedHomeworks.map((hw) => hw._id));

				return { findArchivedHomeworkIdsByUserStub, replaceUserInArchivedHomeworksStub, archivedHomeworks };
			};

			// true work
			it('should return deleted archived submissions', async () => {
				// given
				const { findArchivedHomeworkIdsByUserStub, replaceUserInArchivedHomeworksStub, archivedHomeworks } = initStubs({
					archived: userId,
				});
				// when
				const { removeConnectionToArchivedHomeworks } = mapByName(deleteUserRelatedData());
				const result = await removeConnectionToArchivedHomeworks(userId, replaceUserId);
				findArchivedHomeworkIdsByUserStub.restore();
				replaceUserInArchivedHomeworksStub.restore();
				// then
				expect(result.complete).to.be.true;
				expect(result.trashBinData).to.be.an('object');
				expect(result.trashBinData).to.haveOwnProperty('scope');
				expect(result.trashBinData).to.haveOwnProperty('data');
				expect(result.trashBinData.scope).to.be.equal('homeworks-archived');
				expect(result.trashBinData.data.map(idToString)).to.have.members(
					archivedHomeworks.map((hw) => idToString(hw._id))
				);
			});

			// user not exist
			it('should return empty data if not archived submissions', async () => {
				// given
				const otherUserId = new ObjectId();
				const { findArchivedHomeworkIdsByUserStub, replaceUserInArchivedHomeworksStub } = initStubs({
					archived: userId,
				});
				// when
				const { removeConnectionToArchivedHomeworks } = mapByName(deleteUserRelatedData());
				const result = await removeConnectionToArchivedHomeworks(otherUserId, replaceUserId);
				findArchivedHomeworkIdsByUserStub.restore();
				replaceUserInArchivedHomeworksStub.restore();
				// then
				expect(result.complete).to.be.true;
				expect(result.trashBinData.data).to.be.an('array').that.is.empty;
				expect(result.trashBinData.scope).to.be.equal('homeworks-archived');
			});
		});
	});
});
