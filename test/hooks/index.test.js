const { expect } = require('chai');
const reqlib = require('app-root-path').require;

const { BadRequest } = reqlib('src/errors');
const { lookupSchool } = require('../../src/hooks');

const appPromise = require('../../src/app');
const { createTestUser, cleanup } = require('../services/helpers/testObjects')(appPromise);

const { hasPermission } = require('../../src/hooks/index');

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

describe('check permission', () => {
	it('should fail if permissions operator is wrong', () => {
		const inputPermission = 'RANDOM';
		const operator = 'FOO';
		try {
			hasPermission(inputPermission, operator);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(403);
			expect(err.message).to.equal('Invalid function call');
		}
	});

	it('should fail if permission is not set', () => {
		const inputPermission = '';
		try {
			hasPermission(inputPermission);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(403);
			expect(err.message).to.equal('Invalid function call');
		}
	});
});
