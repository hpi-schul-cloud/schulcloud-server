const { expect } = require('chai');

const { BadRequest } = require('../../src/errors');
const { lookupSchool } = require('../../src/hooks');

const appPromise = require('../../src/app');
const { createTestUser, cleanup } = require('../services/helpers/testObjects')(appPromise());
const { setupNestServices, closeNestServices } = require('../utils/setup.nest.services');

describe('#lookupSchool', () => {
	let app;
	let nestServices;

	before(async () => {
		app = await appPromise();
		nestServices = await setupNestServices(app);
	});

	after(async () => {
		await cleanup();
		await closeNestServices(nestServices);
	});

	it('should require authentication to provide a user', async () => {
		try {
			await lookupSchool({});
			expect.fail('This call should have failed');
		} catch (err) {
			expect(err).to.be.instanceOf(BadRequest);
		}
		try {
			await lookupSchool({
				params: {
					query: { _id: 42 },
				},
			});
			expect.fail('This call should have failed');
		} catch (err) {
			expect(err).to.be.instanceOf(BadRequest);
		}
	});

	it("should add the logged-in user' school to the request params", async () => {
		const user = await createTestUser();
		const context = await lookupSchool({
			app,
			params: {
				account: {
					userId: user._id,
				},
			},
		});
		expect(context.params.account.schoolId.toString()).to.equal(user.schoolId.toString());
	});
});
