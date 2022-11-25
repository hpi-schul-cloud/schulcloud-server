const { expect } = require('chai');

const appPromise = require('../../../../../src/app');
const { setupNestServices, closeNestServices } = require('../../../../utils/setup.nest.services');

const testObjects = require('../../../helpers/testObjects')(appPromise());

const { equal: equalIds } = require('../../../../../src/helper/compare').ObjectId;

const { findSchool, createUserAndAccount } = require('../../../../../src/services/sync/strategies/TSP/TSP');
const { userModel } = require('../../../../../src/services/user/model');

describe('TSP API integration tests', () => {
	let app;
	let server;
	let nestServices;
	let nestAccountService;

	let createdAccount;
	let createdUser;

	before(async () => {
		app = await appPromise();
		server = app.listen(0);
		nestServices = await setupNestServices(app);
		nestAccountService = app.service('nest-account-service');
	});

	after(async () => {
		await server.close();
		await closeNestServices(nestServices);
	});

	afterEach(async () => {
		if (createdAccount) {
			await nestAccountService.delete(createdAccount.id);
			createdAccount = undefined;
		}

		if (createdUser) {
			await userModel.remove(createdUser);
			createdUser = undefined;
		}

		await testObjects.cleanup();
	});

	describe('#findSchool', () => {
		it('should find a school based on its TSP school identifier', async () => {
			const tspIdentifier = '47274';
			const school = await testObjects.createTestSchool({
				source: 'tsp',
				sourceOptions: { schoolIdentifier: tspIdentifier },
			});
			const foundSchool = await findSchool(app, tspIdentifier);
			expect(equalIds(school._id, foundSchool._id)).to.equal(true);
		});

		it('returns null if no school was found', async () => {
			const foundSchool = await findSchool(app, '63472');
			expect(foundSchool).to.equal(null);
		});
	});

	describe('#createUserAndAccount', () => {
		it('should create an activated user and account based on the given details', async () => {
			const school = await testObjects.createTestSchool();
			const userDetails = {
				firstName: 'Thor',
				lastName: 'Heyerdahl',
				email: 'sailing@pacific.ocean',
				schoolId: school._id,
				source: 'tsp',
				sourceOptions: { awesome: true, tspUid: '2345' },
			};
			const roles = ['administrator', 'teacher'];
			const systemId = (await testObjects.createTestSystem())._id;
			createdUser = await createUserAndAccount(app, userDetails, roles, systemId);
			createdAccount = await nestAccountService.findByUserId(createdUser._id);

			expect(createdUser).to.be.ok;
			expect(createdUser.source).to.equal('tsp');
			expect(createdUser.sourceOptions.awesome).to.equal(true);
			expect(createdAccount.username).to.equal('tsp/2345');
			expect(createdAccount.activated).to.equal(true);
		});
	});
});
