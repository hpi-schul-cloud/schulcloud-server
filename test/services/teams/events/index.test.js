/* eslint-disable no-underscore-dangle */
/* eslint-disable new-cap */

const { expect } = require('chai');
const sleep = require('util').promisify(setTimeout);

const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);

const DELAY_TIME = 250;

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
			const teamWithAddedUser = await testObjects.teams.addTeamUserToTeam(team._id.toString(), user);

			// Test if patch user into team works.
			expect(teamWithAddedUser.userIds).to.be.an('array').with.lengthOf(2);

			await app.service('users').remove(user._id);

			// Execute the primary test with short delay. That the async event process can finished.
			await sleep(DELAY_TIME);

			const teamWithRemovedUser = await testObjects.teams.getById(team._id.toString());
			const found = teamWithRemovedUser.userIds.some(
				(teamUser) => teamUser.userId.toString() === user._id.toString(),
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

			const notExistingTeam = await testObjects.teams.getById(team._id.toString());
			expect(notExistingTeam).to.not.be.undefined;
		});
	});
});
