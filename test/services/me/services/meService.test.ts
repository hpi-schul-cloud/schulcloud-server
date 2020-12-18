import assert from 'assert';
import { expect } from 'chai';
import appPromise from '../../../../src/app';

import testObjectsImport from '../../helpers/testObjects'; 
const testObjects = testObjectsImport(appPromise);
import compareImport from '../../../../src/helper/compare'; 
const { equal: equalIds } = compareImport.ObjectId;

describe('me service', () => {
	let app;
	let meService;
	let server;

	before(async () => {
		app = await appPromise;
		meService = app.service('legacy/v1/me');
		server = await app.listen(0);
	});

	after((done) => {
		server.close(done);
	});

	it('registered the me service', () => {
		assert.ok(meService);
	});

	describe('GET', () => {
		it('should return own user', async () => {
			const student = await testObjects.createTestUser({
				roles: ['student'],
				birthday: Date.now(),
				ldapId: 'thisisauniqueid',
			});
			const params = await testObjects.generateRequestParamsFromUser(student);
			params.query = {};
			const result = await meService.find(params);
			expect(result).to.not.be.undefined;
			expect(equalIds(result.id, student._id)).to.be.true;
		});
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});
});
