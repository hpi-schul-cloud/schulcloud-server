const { expect } = require('chai');
const logger = require('winston');
const { ObjectId } = require('mongoose').Types;

const app = require('../../../src/app');
const T = require('../helpers/testObjects')(app);

const teamService = app.service('/teams');


describe('Test team basic methods', () => {
	describe('teams create', () => {
		let team;
		let teamId;
		let userId;

		before(async () => {
			const user = await T.createTestUser().catch((err) => {
				logger.warn('Can not create test user', err);
			});

			const schoolId = user.schoolId.toString();
			userId = user._id.toString();
			const fakeLoginParams = T.fakeLoginParams({ userId });

			team = await teamService.create({
				name: 'TestTeam',
				schoolId,
				userIds: [userId],
			}, fakeLoginParams).catch((err) => {
				logger.warn('Can not create test team', err);
			});

			teamId = team._id.toString();

			return Promise.resolve();
		});

		after(() => Promise.all([T.cleanup(), T.teams.removeOne(teamId)]));


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

		it('should find created test team for user', async () => {
			const result = await app.service('teams').find(userId);
			const elements = [];
			result.data.forEach((element) => {
				elements.push(element._id);
			});
			const testTeam = elements.pop();
			expect(testTeam.toString()).to.equal(teamId);
		});

		it('is allowed for superheroes', async () => {
			const hero = await T.createTestUser({ roles: ['superhero'] });
			const username = hero.email;
			const password = 'Schulcloud1!';
			await T.createTestAccount({ username, password }, 'local', hero);
			const params = await T.generateRequestParams({ username, password });

			try {
				const record = {
					name: 'test',
					schoolId: hero.schoolId,
					schoolIds: [hero.schoolId],
					userIds: [hero._id],
				};
				const slimteam = await teamService.create(record, { ...params, query: {} });
				expect(slimteam).to.be.ok;

				const { userIds } = await teamService.get(slimteam._id);
				expect(userIds.some(item => item.userId.toString() === hero._id.toString())).to.equal(true);
			} finally {
				T.cleanup();
			}
		});
	});
});
