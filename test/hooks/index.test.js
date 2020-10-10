const { expect } = require('chai');
const reqlib = require('app-root-path').require;

const { BadRequest } = reqlib('src/errors');
const { lookupSchool } = require('../../src/hooks');

const appPromise = require('../../src/app');
const { createTestUser, cleanup } = require('../services/helpers/testObjects')(appPromise);

describe('#lookupSchool', () => {
	let app;

	before(async () => {
		app = await appPromise;
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

	after(cleanup);
});
