const { expect } = require('chai');
const mockery = require('mockery');
const { ObjectId } = require('mongoose').Types;

// const deleteUserDataUcRewire = rewire('./deleteUserData.uc');

const file = (userId) => ({
	_id: ObjectId(),
	isDirectory: false,
	name: 'lorem-image.png',
	type: 'image/png',
	size: 12345,
	storageFileName: 'lorem-image.png',
	thumbnail: 'https://schulcloud.org/images/login-right.png',
	permissions: [{ write: true, read: true, create: true, delete: true, refId: userId, refPermModel: 'user' }],
	owner: userId,
	creator: userId,
	refOwnerModel: 'user',
	thumbnailRequestToken: '123 - uuidv4',
});

describe('deletedUserData.uc.unit', () => {
	describe('deleteUserData', () => {
		let deleteUserData;

		const mockRepo = {
			findFilesThatUserCanAccess: async (userId) => [file(userId), file(userId)],
			deleteFilesByIDs: async () => ({ n: 3, ok: 1, deletedCount: 3 }),
			findPersonalFiles: async (userId) => [file(userId), file(userId)],
			removeFilePermissionsByUserId: async () => ({ n: 3, ok: 1, nModified: 3 }),
		};

		before(() => {
			mockery.enable({
				warnOnReplace: false,
				warnOnUnregistered: false,
				useCleanCache: true,
			});
			mockery.registerMock('../repo/files.repo', mockRepo);
			// eslint-disable-next-line global-require
			({ deleteUserData } = require('./deleteUserData.uc'));
		});

		after(() => {
			mockery.deregisterAll();
			mockery.disable();
		});

		it('all should work without errors', async () => {
			const userId = ObjectId();
			const result = await deleteUserData(userId);
			expect(result).to.have.all.keys('context', 'deleted', 'references', 'errors');

			expect(result.errors).to.be.an('array').with.lengthOf(0);
			expect(result.deleted).to.be.an('array').with.lengthOf(2);
			expect(result.references).to.be.an('array').with.lengthOf(2);

			expect(result.deleted[0]).to.have.all.keys(Object.keys(file(userId)));
			expect(result.references[0]).to.not.have.all.keys(Object.keys(file(userId)));
			expect(result.references[0]._id).to.not.undefined;
		});
	});

	describe('deleteUserData', () => {
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
			const result = await deleteUserData(ObjectId());
			expect(result).to.have.all.keys('context', 'deleted', 'references', 'errors');

			expect(result.errors).to.be.an('array').with.lengthOf(2);
			expect(result.deleted).to.be.an('array').with.lengthOf(0);
			expect(result.references).to.be.an('array').with.lengthOf(0);

			// we also check if they are executed in the right order
			const personalFilesError = result.errors[0];
			expect(personalFilesError.message).to.equal('Incomple deletions:');
			expect(personalFilesError.code).to.equal(400);
			expect(personalFilesError.errors).to.eql({ n: 3, ok: 0, deletedCount: 2, failedFileIds: [] });

			const removePermError = result.errors[1];
			expect(removePermError.message).to.equal('Incomple deletions:');
			expect(removePermError.code).to.equal(400);
			expect(removePermError.errors).to.eql({ n: 3, ok: 0, nModified: 2, failedFileIds: [] });
		});
	});

	describe('WWW turn off by alien attack, what should our application do?', () => {
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
			const result = await deleteUserData(ObjectId());
			expect(result).to.have.all.keys('context', 'deleted', 'references', 'errors');

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
