const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const appPromise = require('../../../src/app');
const { FileModel } = require('../../../src/services/fileStorage/model');

const testObjects = require('../helpers/testObjects')(appPromise());

describe('files proxy service', () => {
	let app;
	let server;
	let sharedTokenService;

	before(async () => {
		app = await appPromise();
		sharedTokenService = app.service('fileStorage/shared');
		server = await app.listen(0);
	});

	after((done) => {
		server.close(done);
	});

	describe('get', () => {
		const setup = async () => {
			const owner = await testObjects.createTestUser();
			const file = await testObjects.createTestFile({ owner: owner._id, shareTokens: ['abc'] });

			const user = await testObjects.createTestUser({ roles: ['teacher'] });
			const userRequestParams = await testObjects.generateRequestParamsFromUser(user);
			return { file, userRequestParams };
		};

		describe('block file requests', () => {
			it('should return error when file does not exist', async () => {
				const { userRequestParams } = await setup();

				try {
					await sharedTokenService.get(new ObjectId(), userRequestParams);
					throw new Error('should have failed');
				} catch (err) {
					expect(err.message).to.not.equal('should have failed');
					expect(err.code).to.equal(403);
				}
			});

			it('should return error when share token is wrong', async () => {
				const { file, userRequestParams } = await setup();

				userRequestParams.query = { shareToken: 'def' };
				try {
					await sharedTokenService.get(file._id, userRequestParams);
					throw new Error('should have failed');
				} catch (err) {
					expect(err.message).to.not.equal('should have failed');
					expect(err.code).to.equal(403);
				}
			});

			it('should return error when no share token provided', async () => {
				const { file, userRequestParams } = await setup();

				try {
					await sharedTokenService.get(file._id, userRequestParams);
					throw new Error('should have failed');
				} catch (err) {
					expect(err.message).to.not.equal('should have failed');
					expect(err.code).to.equal(403);
				}
			});
		});

		describe('answer file requests', () => {
			it('should return file when share token is correct', async () => {
				const { file, userRequestParams } = await setup();

				userRequestParams.query = { shareToken: 'abc' };
				const result = await sharedTokenService.get(file._id, userRequestParams);
				expect(result._id.toString()).to.equal(file._id.toString());
			});
		});
	});

	describe('patch', () => {
		describe('when user is owner', () => {
			const setup = async () => {
				const owner = await testObjects.createTestUser({ roles: ['teacher'] });
				const file = await testObjects.createTestFile({ owner: owner._id, shareTokens: ['abc'] });

				const userRequestParams = await testObjects.generateRequestParamsFromUser(owner);
				return { file, userRequestParams };
			};

			it('should add shareToken to existing sharetokens', async () => {
				const { file, userRequestParams } = await setup();
				const data = { shareToken: 'ghi' };

				await sharedTokenService.patch(file._id, data, userRequestParams);
				const result = await FileModel.findOne({ _id: file._id }).lean().exec();
				expect(result.shareTokens.length).to.equal(2);
				expect(result.shareTokens.includes('ghi')).to.equal(true);
			});

			it('should throw without shareToken', async () => {
				const { file, userRequestParams } = await setup();
				const data = {};

				try {
					await sharedTokenService.patch(file._id, data, userRequestParams);
					throw new Error('should have failed');
				} catch (err) {
					expect(err.message).to.not.equal('should have failed');
					expect(err.code).to.equal(400);
				}
			});
		});

		describe('when user has no access', () => {
			const setup = async () => {
				const owner = await testObjects.createTestUser();
				const file = await testObjects.createTestFile({ owner: owner._id, shareTokens: ['abc'] });

				const user = await testObjects.createTestUser({ roles: ['teacher'] });
				const userRequestParams = await testObjects.generateRequestParamsFromUser(user);
				return { file, userRequestParams };
			};

			it('should throw Forbidden', async () => {
				const { file, userRequestParams } = await setup();
				const data = { shareToken: 'ghi' };

				try {
					await sharedTokenService.patch(file._id, data, userRequestParams);
					throw new Error('should have failed');
				} catch (err) {
					expect(err.message).to.not.equal('should have failed');
					expect(err.code).to.equal(403);
				}
			});
		});
	});
});
