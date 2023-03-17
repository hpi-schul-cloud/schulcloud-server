const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise());
const sinon = require('sinon');
const { ObjectId } = require('mongoose').Types;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const deleteUserTeamsData = require('../../teams/uc/deleteUserTeamsData.uc');
const { setupNestServices, closeNestServices } = require('../../../../test/utils/setup.nest.services');

const { teamsRepo } = require('../repo/index');
const { AssertionError } = require('../../../errors');

const { expect } = chai;
chai.use(chaiAsPromised);

const USER_ID = new ObjectId();
const TEAMS_ID = new ObjectId();

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

const initTeamsStubs = ({ teamsId }) => {
	const getTeamsStub = sinon.stub(teamsRepo, 'getTeamsIdsForUser');
	getTeamsStub.callsFake(() => []);
	getTeamsStub.withArgs(USER_ID).returns(createTestGetTeamsForUserResult(teamsId));

	const removeTeamsStub = sinon.stub(teamsRepo, 'removeUserFromTeams');
	removeTeamsStub.withArgs(USER_ID).returns({ success: true, modifiedDocuments: 1 });

	return { getTeamsStub, removeTeamsStub };
};

describe('delete teams user data usecase', () => {
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

	describe('delete teams user data usecase', () => {
		it('should return a function', async () => {
			const deleteUserDataFromTeams = deleteUserTeamsData.deleteUserData;

			expect(deleteUserDataFromTeams).to.be.an('Array');
			expect(deleteUserDataFromTeams.length).to.be.equal(1);
			expect(deleteUserDataFromTeams[0]).to.be.a('function');
		});

		it('should return a valid result (trashbin) object', async () => {
			const { getTeamsStub, removeTeamsStub } = initTeamsStubs({ teamsId: TEAMS_ID });

			const deleteUserDataFromTeams = deleteUserTeamsData.deleteUserData[0];
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
			const deleteUserDataFromTeams = deleteUserTeamsData.deleteUserData[0];
			await expect(deleteUserDataFromTeams('NOT_AN_ID')).to.be.rejectedWith(AssertionError);
		});
	});
});
