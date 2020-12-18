import { expect } from 'chai';
import rootPathImport from 'app-root-path'; 
const reqlib = rootPathImport.require;

const { BadRequest } = reqlib('src/errors');
import { lookupSchool } from '../../src/hooks';

import appPromise from '../../src/app';
import testObjectsImport from '../services/helpers/testObjects'; 
const { createTestUser, cleanup } = testObjectsImport(appPromise);

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
