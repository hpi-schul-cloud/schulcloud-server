const { expect } = require('chai');

const appPromise = require('../../../../../src/app');
const { setupNestServices, closeNestServices } = require('../../../../utils/setup.nest.services');

const testObjects = require('../../../helpers/testObjects')(appPromise());

const { deleteUser } = require('../../../../../src/services/sync/strategies/TSP/SchoolChange');

const userRepo = require('../../../../../src/components/user/repo/user.repo');
const { NotFound } = require('../../../../../src/errors');

describe('SchooolChange API integration tests', () => {
	let app;
	let server;
	let nestServices;

	let nestAccountService;
	let teamService;

	before(async () => {
		app = await appPromise();
		server = app.listen(0);
		nestServices = await setupNestServices(app);
		nestAccountService = app.service('nest-account-service');
		teamService = app.service('teams');
	});

	after(async () => {
		await server.close();
		await closeNestServices(nestServices);
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});

	describe('deleteUser', () => {
		it('should delete user, users account and delete user from teams', async () => {
			const team = await testObjects.createTestTeamWithOwner({ roles: 'teacher' });
			const credentials = { username: team.user.email, password: `${Date.now()}` };
			await testObjects.createTestAccount(credentials, 'local', team.user);

			await deleteUser(app, team.user);

			await expect(userRepo.getUser(team.user._id)).to.be.rejectedWith(NotFound);
			const deletedAccount = await nestAccountService.findByUserId(team.user._id);
			expect(deletedAccount).to.be.equal(null);
			const deletedUserTeams = await teamService.find({
				query: {
					$limit: false,
					userIds: { $elemMatch: { userId: team.user._id } },
				},
			});
			expect(deletedUserTeams.total).to.be.equal(0);
		});
	});
});
