/* eslint-disable no-underscore-dangle */
/* eslint-disable new-cap */

const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const sleep = require('util').promisify(setTimeout);

const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);
const { userModel } = require('../../../../src/services/user/model');
const { teamsModel, teamUserModel } = require('../../../../src/services/teams/model');

const DELAY_TIME = 250;
const schoolId = ObjectId();
const userRoleId = ObjectId();
const teamRoleId = ObjectId();

const createTeamUser = userId => (new teamUserModel({ role: teamRoleId, schoolId, userId }))._doc;

const createUser = () => {
	const time = Date.now();
	return userModel.create({
		firstName: time,
		lastName: 'test',
		email: `${time}.test@test.de`,
		roles: [userRoleId],
		schoolId,
	}).then(user => user._doc);
};

const createTeam = owner => teamsModel.create({
	name: `${Date.now()}_test`,
	schoolId,
	schoolIds: [schoolId],
	userIds: [createTeamUser(owner._id)],
}).then(team => team._doc);

const patchTeam = (id, user) => teamsModel.findOneAndUpdate(
	{ _id: id },
	{ $push: { userIds: createTeamUser(user._id) } },
	{ new: true },
).lean().exec();

const getTeam = id => teamsModel.findById(id).lean().exec();

// only for save clear after tests
const removeTeam = id => teamsModel.findOneAndRemove({ _id: id });
const removeUser = id => userModel.findOneAndRemove({ _id: id });

describe('Test user remove events for teams.', () => {
	describe('Test if own of the users is removed.', () => {
		let team;

		before(async () => {
			({ team } = await testObjects.createTestTeamWithOwner());
			return Promise.resolve();
		});

		after(async () => {
			await testObjects.cleanup();
			return Promise.resolve();
		});

		it('should remove user from team', async () => {
			// Test if team has only owner inside the team.
			expect(team.userIds).to.be.an('array').with.lengthOf(1);

			const user = await testObjects.createTestUser();
			const teamWithAddedUser = await patchTeam(team._id.toString(), user);

			// Test if patch user into team works.
			expect(teamWithAddedUser.userIds).to.be.an('array').with.lengthOf(2);

			await app.service('users').remove(user._id);

			// Execute the primary test with short delay. That the async event process can finished.
			await sleep(DELAY_TIME);

			const teamWithRemovedUser = await getTeam(team._id.toString());
			const found = teamWithRemovedUser.userIds.some(
				teamUser => teamUser.userId.toString() === user._id.toString(),
			);
			expect(found).to.equal(false);
			expect(teamWithRemovedUser.userIds).to.be.an('array').with.lengthOf(1);
		});
	});

	describe('Test if the last user is removed.', () => {
		let team;
		let owner;

		before(async () => {
			({ team, user: owner } = await testObjects.createTestTeamWithOwner());
			return Promise.resolve();
		});

		after(async () => {
			await testObjects.cleanup();
			return Promise.resolve();
		});

		it('should remove team if last user is deleted.', async () => {
			// Test if team has only owner inside the team.
			expect(team.userIds).to.be.an('array').with.lengthOf(1);
			await app.service('users').remove(owner._id.toString());

			// Execute the primary test with short delay. That the async event process can finished.
			await sleep(DELAY_TIME);

			const notExistingTeam = await getTeam(team._id.toString());
			expect(notExistingTeam).to.not.be.undefined;
		});
	});
});
