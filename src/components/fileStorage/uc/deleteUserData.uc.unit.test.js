const { expect } = require('chai');
const mockery = require('mockery');
const sinon = require('sinon');
const { ObjectId } = require('mongoose').Types;

const { removePermissionsThatUserCanAccess } = require('./deleteUserData.uc');

const fileRepo = require('../repo/files.repo');

describe.only('deletedUserData.uc.unit', function () {
	describe('removePermissionsThatUserCanAccess', () => {
		it('when the function is called with valid user id, then it returns with valud trash bin format', async () => {
			const userId = new ObjectId();
			const fileRepoStub = sinon.stub(fileRepo, 'removeFilePermissionsByUserId');
			fileRepoStub.withArgs(userId).returns({
				_id: 1,
				filePermissions: [
					{
						_id: new ObjectId(),
						permissions: [
							{
								refId: userId,
							},
						],
					},
				],
			});
			const result = await removePermissionsThatUserCanAccess(userId);
			expect(result.trashBinData).to.be.an('array');
			result.trashBinData.forEach((data) => {
				expect(data).to.haveOwnProperty('scope');
				expect(data.data).to.be.an('object');
			});
		});
	});

	describe.skip('deleteUserData', () => {
		let deleteUserData;

		const mockRepo = {
			findFilesThatUserCanAccess: async () => [],
			deleteFilesByIDs: async () => ({ n: 3, ok: 0, deletedCount: 2 }),
			findPersonalFiles: async () => [],
			removeFilePermissionsByUserId: async () => ({ n: 3, ok: 0, nModified: 2 }),
		};

		before(() => {
			mockery.enable({
				warnOnReplace: false,
				warnOnUnregistered: false,
				useCleanCache: true,
			});
			// delete require.cache[require.resolve('../repo/files.repo')];
			mockery.registerMock('../repo/files.repo', mockRepo);
			// eslint-disable-next-line global-require
			({ deleteUserData } = require('./deleteUserData.uc'));
		});

		after(() => {
			mockery.deregisterAll();
			mockery.disable();
		});

		it('should handle errors', async () => {
			const userId = ObjectId();
			const result = await deleteUserData(userId);
			expect(result).to.have.all.keys('context', 'deleted', 'references', 'errors', 'userId');

			expect(result.context).to.equal('files');
			expect(result.userId.toString()).to.equal(userId.toString());
			expect(result.errors).to.be.an('array').with.lengthOf(2);
			expect(result.deleted).to.be.an('array').with.lengthOf(0);
			expect(result.references).to.be.an('array').with.lengthOf(0);

			// we also check if they are executed in the right order
			const personalFilesError = result.errors[0];
			expect(personalFilesError.message).to.equal('Incomple deletions:');
			expect(personalFilesError.code).to.equal(400);
			expect(personalFilesError.errors).to.eql({ n: 3, ok: 0, deletedCount: 2, failedFileIds: [], type: 'deleted' });

			const removePermError = result.errors[1];
			expect(removePermError.message).to.equal('Incomple deletions:');
			expect(removePermError.code).to.equal(400);
			expect(removePermError.errors).to.eql({ n: 3, ok: 0, nModified: 2, failedFileIds: [], type: 'references' });
		});
	});

	describe.skip('WWW turn off by alien attack, what should our application do?', () => {
		let deleteUserData;

		const mockRepo = {
			findFilesThatUserCanAccess: async () => {
				throw new Error('error');
			},
			deleteFilesByIDs: async () => {
				throw new Error('error');
			},
			findPersonalFiles: async () => {
				throw new Error('error');
			},
			removeFilePermissionsByUserId: async () => {
				throw new Error('error');
			},
		};

		before(() => {
			mockery.enable({
				warnOnReplace: false,
				warnOnUnregistered: false,
				useCleanCache: true,
			});
			// delete require.cache[require.resolve('../repo/files.repo')];
			mockery.registerMock('../repo/files.repo', mockRepo);
			// eslint-disable-next-line global-require
			({ deleteUserData } = require('./deleteUserData.uc'));
		});

		after(() => {
			mockery.deregisterAll();
			mockery.disable();
		});

		it('kill all invaders', async () => {
			const userId = ObjectId();
			const result = await deleteUserData(userId);
			expect(result).to.have.all.keys('context', 'deleted', 'references', 'errors', 'userId');

			expect(result.context).to.equal('files');
			expect(result.userId.toString()).to.equal(userId.toString());
			expect(result.errors).to.be.an('array').with.lengthOf(2);
			expect(result.deleted).to.be.an('array').with.lengthOf(0);
			expect(result.references).to.be.an('array').with.lengthOf(0);

			// we also check if they are executed in the right order
			const personalFilesError = result.errors[0];
			expect(personalFilesError instanceof Error).to.be.true;
			expect(personalFilesError.message).to.equal('Can not deleted personal files.');
			expect(personalFilesError.code).to.equal(422);
			expect(personalFilesError.errors instanceof Error).to.be.true;
			expect(personalFilesError.errors.message).to.equal('error');

			const removePermError = result.errors[1];
			expect(removePermError instanceof Error).to.be.true;
			expect(removePermError.message).to.equal('Can not remove file permissions.');
			expect(removePermError.code).to.equal(422);
			expect(removePermError.errors instanceof Error).to.be.true;
			expect(removePermError.errors.message).to.equal('error');
		});
	});
});
