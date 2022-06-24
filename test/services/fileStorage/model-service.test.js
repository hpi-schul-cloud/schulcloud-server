const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const appPromise = require('../../../src/app');

const testObjects = require('../helpers/testObjects')(appPromise());

describe('files model service', () => {
	let app;
	let server;
	let modelService;

	before(async () => {
		app = await appPromise();
		modelService = app.service('files');
		server = await app.listen(0);
	});

	after((done) => {
		server.close(done);
	});

	describe('get', () => {
		const setup = async () => {
			const owner = await testObjects.createTestUser();
			const file = await testObjects.createTestFile({ owner: owner._id, shareToken: 'abc' });

			const user = await testObjects.createTestUser({ roles: ['teacher'] });
			const userRequestParams = await testObjects.generateRequestParamsFromUser(user);
			return { file, userRequestParams };
		};

		describe('block file requests', () => {
			it('should return error when file does not exist', async () => {
				const { userRequestParams } = await setup({ shareToken: 'abc' });

				try {
					await modelService.get(new ObjectId(), userRequestParams);
					throw new Error('should have failed');
				} catch (err) {
					expect(err.message).to.not.equal('should have failed');
					expect(err.code).to.equal(404);
				}
			});

			it('should return error when filtering by wrong share token', async () => {
				const { file, userRequestParams } = await setup();

				userRequestParams.query = { shareToken: 'def' };
				try {
					await modelService.get(file._id, userRequestParams);
					throw new Error('should have failed');
				} catch (err) {
					expect(err.message).to.not.equal('should have failed');
					expect(err.code).to.equal(403);
				}
			});
		});

		describe('answer file requests', () => {
			it('should return file when not filtering by share token', async () => {
				// these requests should only come so farä, when the user is the owner
				const { file, userRequestParams } = await setup();

				const result = await modelService.get(file._id, userRequestParams);
				expect(result._id.toString()).to.equal(file._id.toString());
			});

			it('should return file when filtering by correct share token', async () => {
				const { file, userRequestParams } = await setup();

				userRequestParams.query = { shareToken: 'abc' };
				const result = await modelService.get(file._id, userRequestParams);
				expect(result._id.toString()).to.equal(file._id.toString());
			});
		});
	});
});
