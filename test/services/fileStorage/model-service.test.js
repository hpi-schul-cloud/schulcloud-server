const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const appPromise = require('../../../src/app');

const testObjects = require('../helpers/testObjects')(appPromise);

describe('files model service', () => {
	let app;
	let server;
	let modelService;

	before(async () => {
		app = await appPromise;
		modelService = app.service('files');
		server = await app.listen(0);
	});

	after((done) => {
		server.close(done);
	});

	describe('get', () => {
		it('should return error when file does not exist', async () => {
			await testObjects.createTestRole({
				name: 'studentList',
				permissions: ['STUDENT_LIST', 'FILESTORAGE_VIEW'],
			});
			const user = await testObjects.createTestUser({ roles: ['teacher'] });
			const params = await testObjects.generateRequestParamsFromUser(user);
			try {
				await modelService.get(new ObjectId(), params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(404);
			}
		});

		it('should return file when filtering by correct share code', async () => {
			const owner = await testObjects.createTestUser();
			const file = await testObjects.createTestFile({ owner: owner._id, shareToken: 'abc' });

			await testObjects.createTestRole({
				name: 'studentList',
				permissions: ['STUDENT_LIST', 'FILESTORAGE_VIEW'],
			});
			const user = await testObjects.createTestUser({ roles: ['teacher'] });
			const params = await testObjects.generateRequestParamsFromUser(user);
			params.query = { shareToken: 'abc' };
			const result = await modelService.get(file._id, params);
			expect(result._id.toString()).to.equal(file._id.toString());
		});

		it('should return error when filtering by wrong share code', async () => {
			const owner = await testObjects.createTestUser();
			const file = await testObjects.createTestFile({ owner: owner._id, shareToken: 'abc' });

			await testObjects.createTestRole({
				name: 'studentList',
				permissions: ['STUDENT_LIST', 'FILESTORAGE_VIEW'],
			});
			const user = await testObjects.createTestUser({ roles: ['teacher'] });
			const params = await testObjects.generateRequestParamsFromUser(user);
			params.query = { shareToken: 'def' };
			try {
				await modelService.get(file._id, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
			}
		});

		it('should return file when not filtering by share code', async () => {
			const owner = await testObjects.createTestUser();
			const file = await testObjects.createTestFile({ owner: owner._id, shareToken: 'abc' });

			await testObjects.createTestRole({
				name: 'studentList',
				permissions: ['STUDENT_LIST', 'FILESTORAGE_VIEW'],
			});

			const user = await testObjects.createTestUser({ roles: ['teacher'] });
			const params = await testObjects.generateRequestParamsFromUser(user);

			const result = await modelService.get(file._id, params);
			expect(result._id.toString()).to.equal(file._id.toString());
		});
	});
});
