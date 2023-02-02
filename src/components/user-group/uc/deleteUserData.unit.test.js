const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise());
const sinon = require('sinon');
const { ObjectId } = require('mongoose').Types;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const deleteUserData = require('./deleteUserData.uc');
const deleteUserTeamsData = require('./deleteUserTeamsData.uc');
const { setupNestServices, closeNestServices } = require('../../../../test/utils/setup.nest.services');

const { classesRepo, teamsRepo } = require('../repo/index');
const { AssertionError } = require('../../../errors');
const { toString: idToString } = require('../../../helper/compare').ObjectId;

const { expect } = chai;
chai.use(chaiAsPromised);

const USER_ID = new ObjectId();
const USER_ID_WITH_NO_CLASS_AND_TEAMS = new ObjectId();
const CLASS_ID = new ObjectId();
const TEAMS_ID = new ObjectId();
const createTestGetClassForUserResult = (classId, student, teacher) => {
	if (!classId) {
		return [];
	}

	return [
		{
			_id: classId,
			student,
			teacher,
		},
	];
};

const createTestGetTeamsForUserResult = (teamId) => {
	if (!teamId) {
		return [];
	}

	return [
		{
			_id: teamId,
		},
	];
};

const initClassStubs = ({ classId, isStudent, isTeacher }) => {
	const getClassesStub = sinon.stub(classesRepo, 'getClassesForUser');
	getClassesStub.callsFake(() => []);
	getClassesStub.withArgs(USER_ID).returns(createTestGetClassForUserResult(classId, isStudent, isTeacher));

	const removeClassesStub = sinon.stub(classesRepo, 'removeUserFromClasses');
	removeClassesStub.withArgs(USER_ID).returns({ success: true, modifiedDocuments: 1 });

	return { getClassesStub, removeClassesStub };
};

const initTeamsStubs = ({ teamsId }) => {
	const getTeamsStub = sinon.stub(teamsRepo, 'getTeamsIdsForUser');
	getTeamsStub.callsFake(() => []);
	getTeamsStub.withArgs(USER_ID).returns(createTestGetTeamsForUserResult(teamsId));

	const removeTeamsStub = sinon.stub(teamsRepo, 'removeUserFromTeams');
	removeTeamsStub.withArgs(USER_ID).returns({ success: true, modifiedDocuments: 1 });

	return { getTeamsStub, removeTeamsStub };
};

describe('delete class and teams user data usecase', () => {
	let app;
	let server;
	let nestServices;

	before(async () => {
		app = await appPromise();
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
		await closeNestServices(nestServices);
	});

	describe('delete class user data usecase', () => {
		it('should return a function', async () => {
			const deleteUserDataFromClasses = deleteUserData.deleteUserData;
			expect(deleteUserDataFromClasses).to.be.an('Array');
			expect(deleteUserDataFromClasses.length).to.be.equal(1);
			expect(deleteUserDataFromClasses[0]).to.be.a('function');
		});

		it('should return a valid result (trashbin) object', async () => {
			const { getClassesStub, removeClassesStub } = initClassStubs({ classId: CLASS_ID, isStudent: true, isTeacher: true });

			const deleteUserDataFromClasses = deleteUserData.deleteUserData[0];
			const result = await deleteUserDataFromClasses(USER_ID);
			getClassesStub.restore();
			removeClassesStub.restore();

			expect(result.complete).to.be.true;
			expect(result.trashBinData.data).to.be.an('object');
			expect(result.trashBinData.scope).to.be.equal('classes');
			const { data } = result.trashBinData;
			expect(data.classIds).to.be.an('object');
			expect(data.classIds.student.map(idToString), 'have the class id given as student').to.have.members([
				idToString(CLASS_ID),
			]);
			expect(data.classIds.teacher.map(idToString), 'have the class id given as teacher').to.have.members([
				idToString(CLASS_ID),
			]);
		});

		it('should return an empty result (trashbin) object, for user with no class assigned', async () => {
			const { getClassesStub, removeClassesStub } = initClassStubs({});

			const deleteUserDataFromClasses = deleteUserData.deleteUserData[0];
			const result = await deleteUserDataFromClasses(USER_ID_WITH_NO_CLASS_AND_TEAMS);
			getClassesStub.restore();
			removeClassesStub.restore();

			expect(result.complete).to.be.true;
			expect(result.trashBinData.data).to.be.an('object');
			expect(result.trashBinData.scope).to.be.equal('classes');
			expect(result.trashBinData.data).to.deep.equal({});
		});

		it('should throw an error if called with an invalid ObjectId', async () => {
			const deleteUserDataFromClasses = deleteUserData.deleteUserData[0];
			await expect(deleteUserDataFromClasses('NOT_AN_ID')).to.be.rejectedWith(AssertionError);
		});
	});

	describe('delete teams user data usecase', () => {
		it('should return a function', async () => {
			const deleteUserDataFromClasses = deleteUserTeamsData.deleteUserTeamsData;
			expect(deleteUserDataFromClasses).to.be.an('Array');
			expect(deleteUserDataFromClasses.length).to.be.equal(1);
			expect(deleteUserDataFromClasses[0]).to.be.a('function');
		});

		it('should return a valid result (trashbin) object', async () => {
			const { getTeamsStub, removeTeamsStub } = initTeamsStubs({ teamsId: TEAMS_ID });

			const deleteUserDataFromTeams = deleteUserTeamsData.deleteUserTeamsData[0];
			const result = await deleteUserDataFromTeams(USER_ID);
			getTeamsStub.restore();
			removeTeamsStub.restore();

			expect(result.complete).to.be.true;
			expect(result.trashBinData.data).to.be.an('object');
			expect(result.trashBinData.scope).to.be.equal('teams');
			const { data } = result.trashBinData;
			expect(data.teamIds).to.be.an('object');
		});



		it('should throw an error if called with an invalid ObjectId', async () => {
			const deleteUserDataFromTeams = deleteUserTeamsData.deleteUserTeamsData[0];
			await expect(deleteUserDataFromTeams('NOT_AN_ID')).to.be.rejectedWith(AssertionError);
		});
	});
});
