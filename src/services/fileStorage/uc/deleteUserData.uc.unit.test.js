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

			expect(result.deleted[0]).to.have.all.keys(Object.keys(file));
			expect(result.references[0]).to.not.have.all.keys(Object.keys(file));
			expect(result.references[0]._id).to.not.undefined;
		});
	});

	describe('deleteUserData', () => {
		let deleteUserData;

		const mockRepo = {
			findFilesThatUserCanAccess: () => [],
			deleteFilesByIDs: () => ({ n: 3, ok: 0, deletedCount: 2 }),
			findPersonalFiles: () => [],
			removeFilePermissionsByUserId: () => ({ n: 3, ok: 0, nModified: 2 }),
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

			// TODO: rename error1 //error2 by task to see if they executed in right order
			const error1 = result.errors[0];
			expect(error1.message, 'error 1').to.equal('Incomple deletions:');
			expect(error1.code, 'error 1').to.equal(400);
			expect(error1.errors, 'error 1').to.eql({ n: 3, ok: 0, deletedCount: 2, failedFileIds: [] });

			const error2 = result.errors[1];
			expect(error2.message, 'error 2').to.equal('Incomple deletions:');
			expect(error2.code, 'error 2').to.equal(400);
			expect(error2.errors, 'error 2').to.eql({ n: 3, ok: 0, nModified: 2, failedFileIds: [] });
		});
	});
});
