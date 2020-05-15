const { expect } = require('chai');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);

describe('account model service', () => {
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
	});


	it('external call is blocked', async () => {
		const user = await testObjects.createTestUser({ roles: ['student'] });
		const account = await testObjects.createTestAccount(
			{ username: 'max.externalmustermann@schulcloud.org', password: 'nooneknows' }, undefined, user,
		);
		const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		try {
			await app.service('accountModel').get(account._id, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.eq('should have failed');
			expect(err.code).to.eq(405);
			expect(err.message).to.eq('Provider \'rest\' can not call \'get\'. (disallow)');
		}
	});
});
