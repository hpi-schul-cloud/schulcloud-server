const { expect } = require('chai');
const logger = require('winston');
const { ObjectId } = require('mongoose').Types;

const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);

describe('Test team basic methods', () => {
	describe('teams create', () => {
		let team;
		let teamId;

		before(async () => {
			const user = await testObjects.createTestUser().catch((err) => {
				logger.warn('Can not create test user', err);
			});

			const schoolId = user.schoolId.toString();
			const userId = user._id.toString();
			const fakeLoginParams = testObjects.fakeLoginParams({ userId });

			team = await app.service('teams').create({
				name: 'TestTeam',
				schoolId,
				// schoolIds: [schoolId],
				userIds: [userId],
			}, fakeLoginParams).catch((err) => {
				logger.warn('Can not create test team', err);
			});

			teamId = team._id.toString();

			return Promise.resolve();
		});

		after(() => Promise.all([testObjects.cleanup(), testObjects.teams.removeOne(teamId)]));

		it('should for extern request only return the _id', () => {
			expect(Object.keys(team)).to.be.an('array').to.has.lengthOf(1);
			expect(ObjectId.isValid(team._id)).to.be.true;
		});

		it('should have 2 valid filePermissions that has ref to valid roles', async () => {
			const { filePermission } = await app.service('teams').get(teamId);
			expect(filePermission).to.be.an('array').to.have.lengthOf(2);
			expect(ObjectId.isValid(filePermission[0].refId)).to.be.true;
			expect(ObjectId.isValid(filePermission[1].refId)).to.be.true;
		});
	});
});
