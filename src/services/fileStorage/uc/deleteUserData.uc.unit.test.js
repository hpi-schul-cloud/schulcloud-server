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
			findFilesThatUserCanAccess: (userId) => [file(userId), file(userId)],
			deleteFilesByIDs: () => ({ n: 3, ok: 1, deletedCount: 3 }),
			findPersonalFiles: (userId) => [file(userId), file(userId)],
			removeFilePermissionsByUserId: () => ({ n: 3, ok: 1, nModified: 3 }),
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
			const result = await deleteUserData(ObjectId());
			expect(result).to.have.all.keys('context', 'deleted', 'references', 'errors');
			expect(result.errors).to.be.an('array').with.lengthOf(0);
			expect(result.deleted).to.be.an('array').with.lengthOf(2);
			expect(result.references).to.be.an('array').with.lengthOf(2);
			// TODO: test partial
			// TODO: deleted has all keys
		});
	});
});
