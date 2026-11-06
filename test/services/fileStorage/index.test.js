const { expect } = require('chai');
const assert = require('assert');
const { ObjectId } = require('mongoose').Types;
const sinon = require('sinon');
const appPromise = require('../../../src/app');
const { FileModel } = require('../../../src/services/fileStorage/model');
const { schoolModel } = require('../../../src/services/school/model');
const { userModel } = require('../../../src/services/user/model');
const RoleModel = require('../../../src/services/role/model');
const { teamsModel } = require('../../../src/services/teams/model');
const { courseModel } = require('../../../src/services/user-group/model');
const fixtures = require('./fixtures');

const setContext = (userId) => {
	return {
		payload: {
			userId: new ObjectId(userId),
			fileStorageType: 'awsS3',
		},
		account: { userId: new ObjectId(userId) },
	};
};

class AWSStrategy {
	deleteFile() {
		return Promise.resolve();
	}

	generateSignedUrl() {
		return Promise.resolve('https://something.com');
	}

	getSignedUrl() {
		return Promise.resolve('https://something.com');
	}
}

describe('fileStorage services', () => {
	let app;
	let server;
	let fileStorageService;
	let signedUrlService;
	let directoryService;

	before(async () => {
		app = await appPromise();
		server = await app.listen(0);

		fileStorageService = app.service('/fileStorage/');
		signedUrlService = app.service('/fileStorage/signedUrl');
		directoryService = app.service('/fileStorage/directories');

		fileStorageService.Stategy = AWSStrategy;
		signedUrlService.Stategy = AWSStrategy;

		const promises = [
			teamsModel.create(fixtures.teams),
			schoolModel.create(fixtures.schools),
			FileModel.create(fixtures.files),
			userModel.create(fixtures.users),
			courseModel.create(fixtures.courses),
		];

		return Promise.all(promises);
	});

	after(async () => {
		const promises = [
			...fixtures.teams.map((_) => teamsModel.findByIdAndDelete(_._id).exec()),
			...fixtures.schools.map((_) => schoolModel.findByIdAndDelete(_._id).exec()),
			...fixtures.files.map((_) => FileModel.findByIdAndDelete(_._id).exec()),
			...fixtures.users.map((_) => userModel.findByIdAndDelete(_._id).exec()),
			...fixtures.roles.map((_) => RoleModel.findByIdAndDelete(_._id).exec()),
			...fixtures.courses.map((_) => courseModel.findByIdAndDelete(_._id).exec()),
		];

		await Promise.all(promises);
		await server.close();
	});

	describe('file service', () => {
		const params = {
			name: 'test.jpg',
			type: 'image/jpg',
			size: 1200,
			storageFileName: 'storage.jpg',
			thumbnail: 'thumbnail.jpg',
			bucket: 'bucket-test',
			storageProviderId: new ObjectId(),
		};

		const created = [];

		after((done) => {
			const promises = created.map((id) => FileModel.findByIdAndDelete(id));

			Promise.all(promises)
				.then(() => done())
				.catch(() => done());
		});

		it('registered the fileStorage service', () => {
			assert.ok(app.service('fileStorage'));
		});

		it('should create a course file object', (done) => {
			const context = setContext('0000d224816abba584714c8e');

			fileStorageService
				.create({ owner: '0000dcfbfb5c7a3f00bf21ac', ...params }, context)
				.then((res) => {
					// eslint-disable-next-line eqeqeq
					const isEqual = Object.keys(params).every((key) => params[key].toString() == res[key].toString());
					const { _id, isDirectory, refOwnerModel, permissions } = res;

					expect(permissions[0]._id.equals('0000d224816abba584714c8e')).to.be.true;
					expect(permissions).to.have.lengthOf(3);
					expect(refOwnerModel).to.be.equal('course');
					expect(isDirectory).to.be.false;
					expect(isEqual).to.be.true;

					created.push(_id);
					return done();
				})
				.catch(() => done());
		});

		it('should create a team file object', (done) => {
			const context = setContext('0000d224816abba584714c8e');

			fileStorageService
				.create({ owner: '5cf9303bec9d6ac639fefd42', ...params }, context)
				.then((res) => {
					// eslint-disable-next-line eqeqeq
					const isEqual = Object.keys(params).every((key) => params[key].toString() == res[key].toString());
					const { _id, isDirectory, refOwnerModel, permissions } = res;

					expect(permissions[0]._id.equals('0000d224816abba584714c8e')).to.be.true;
					expect(permissions).to.have.lengthOf(6);
					expect(refOwnerModel).to.be.equal('teams');
					expect(isDirectory).to.be.false;
					expect(isEqual).to.be.true;

					created.push(_id);
					return done();
				})
				.catch(() => done());
		});

		it('should create a user file object', (done) => {
			const context = setContext('0000d224816abba584714c8e');

			fileStorageService
				.create({ ...params }, context)
				.then((res) => {
					// eslint-disable-next-line eqeqeq
					const isEqual = Object.keys(params).every((key) => params[key].toString() == res[key].toString());
					const { _id, isDirectory, refOwnerModel, owner, permissions } = res;

					expect(refOwnerModel).to.be.equal('user');
					expect(permissions[0]._id.equals('0000d224816abba584714c8e')).to.be.true;
					expect(permissions).to.have.lengthOf(1);
					expect(owner.equals('0000d224816abba584714c8e')).to.be.true;
					expect(isDirectory).to.be.false;
					expect(isEqual).to.be.true;

					created.push(_id);
					return done();
				})
				.catch(() => done());
		});

		it('should get a file list', (done) => {
			const context = setContext('0000d224816abba584714c8e');

			fileStorageService
				.find({
					query: {
						owner: '5cf9303bec9d6ac639fefd42',
						parent: '5ca613c4c7f5120b8c5bef33',
					},
					...context,
				})
				.then((res) => {
					expect(res).to.have.lengthOf(2);
					return done();
				})
				.catch(() => done());
		});

		it('should reject a file list on folder with no permission', (done) => {
			const context = setContext('0000d224816abba584714c8d');

			fileStorageService
				.find({
					query: {
						parent: '5ca613c4c7f5120b8c5bef33',
						owner: '5cf9303bec9d6ac639fefd42',
					},
					...context,
				})
				.catch((res) => {
					expect(res.code).to.be.equal(403);
					return done();
				});
		});

		it('should get a by access rights filtered file list', (done) => {
			const context = setContext('0000d224816abba584714c8c');

			fileStorageService
				.find({
					query: {
						owner: '5cf9303bec9d6ac639fefd42',
						parent: '5ca613c4c7f5120b8c5bef33',
					},
					...context,
				})
				.then((res) => {
					expect(res).to.have.lengthOf(1);
					return done();
				})
				.catch(() => done());
		});

		it('should delete a file', (done) => {
			const context = setContext('0000d224816abba584714c8c');

			fileStorageService
				.remove('5ca613c4c7f5120b8c5bef34', {
					query: {},
					...context,
				})
				.then((result) => done());
		});

		it('should not delete an unknown file', (done) => {
			const context = setContext('0000d224816abba584714c8c');

			fileStorageService
				.remove('000000000000000000000000', {
					query: {},
					...context,
				})
				.catch(({ code }) => {
					expect(code).to.be.equal(404);
					return done();
				});
		});

		it('should reject deleting a file with no permissions', (done) => {
			const context = setContext('0000d224816abba584714c8c');

			fileStorageService
				.remove('5ca613c4c7f5120b8c5bef35', {
					query: {},
					...context,
				})
				.catch(({ code }) => {
					expect(code).to.be.equal(403);
					return done();
				})
				.finally(() => done());
		});

		const expectMoveRejected = async (userId, fileId, parent) => {
			const before = await FileModel.findById(fileId).lean().exec();
			let error;
			try {
				await fileStorageService.patch(fileId, { parent }, setContext(userId));
			} catch (err) {
				error = err;
			}

			expect(error, 'expected the move to be rejected').to.exist;
			expect(error.code).to.be.equal(403);

			const afterFile = await FileModel.findById(fileId).lean().exec();
			expect(afterFile.owner.equals(before.owner)).to.be.true;
			expect(afterFile.refOwnerModel).to.be.equal(before.refOwnerModel);
			if (before.parent) {
				expect(afterFile.parent.equals(before.parent)).to.be.true;
			} else {
				expect(afterFile.parent).to.equal(undefined);
			}
		};

		it('should move a file into another directory of the same owner and keep that owner', async () => {
			const context = setContext('0000d224816abba584714c8c');

			await fileStorageService.patch(
				'5ca613c4c7f5120b8c5bef37',
				{
					parent: '5ca613c4c7f5120b8c5bef36',
				},
				context
			);

			const moved = await FileModel.findById('5ca613c4c7f5120b8c5bef37').lean().exec();
			expect(moved.parent.equals('5ca613c4c7f5120b8c5bef36')).to.be.true;
			expect(moved.owner.equals('0000dcfbfb5c7a3f00bf21ac')).to.be.true;
			expect(moved.refOwnerModel).to.be.equal('course');
		});

		it('should reject moving file without permission', async () => {
			await expectMoveRejected('0000d224816abba584714c8d', '5ca613c4c7f5120b8c5bef37', '5ca613c4c7f5120b8c5bef33');
		});

		it('should reject moving a teacher file into a student personal folder by id', async () => {
			await expectMoveRejected('0000d224816abba584714c8c', '5ca601745d629505e51252d8', '5ca613c4c7f5120b8c5bef38');

			const teacherFile = await FileModel.findById('5ca601745d629505e51252d8').lean().exec();
			expect(teacherFile.owner.equals('0000d224816abba584714c8e')).to.be.true;
			expect(teacherFile.refOwnerModel).to.be.equal('user');
		});

		it('should reject moving a file from another school into this school', async () => {
			await expectMoveRejected('0000d224816abba584714c8f', '5ca613c4c7f5120b8c5bef39', '5ca613c4c7f5120b8c5bef3a');

			const otherSchoolFile = await FileModel.findById('5ca613c4c7f5120b8c5bef39').lean().exec();
			expect(otherSchoolFile.owner.equals('0000d224816abba584714c8f')).to.be.true;
			expect(otherSchoolFile.refOwnerModel).to.be.equal('user');
		});

		it('should reject moving a writable course file into a personal folder', async () => {
			await expectMoveRejected('0000d224816abba584714c8c', '5ca613c4c7f5120b8c5bef28', '5ca613c4c7f5120b8c5bef38');

			const courseFile = await FileModel.findById('5ca613c4c7f5120b8c5bef28').lean().exec();
			expect(courseFile.owner.equals('0000dcfbfb5c7a3f00bf21ac')).to.be.true;
			expect(courseFile.refOwnerModel).to.be.equal('course');
		});

		it('should move the owner file into a same-school course folder and assign the course as owner', async () => {
			const context = setContext('0000d224816abba584714c8c');

			await fileStorageService.patch(
				'5ca601745d629505e51252d7',
				{
					parent: '5ca613c4c7f5120b8c5bef36',
				},
				context
			);

			const moved = await FileModel.findById('5ca601745d629505e51252d7').lean().exec();
			expect(moved.parent.equals('5ca613c4c7f5120b8c5bef36')).to.be.true;
			expect(moved.owner.equals('0000dcfbfb5c7a3f00bf21ac')).to.be.true;
			expect(moved.refOwnerModel).to.be.equal('course');
		});
	});

	describe('signed url service', () => {
		it('registered the signed url service', () => {
			assert.ok(app.service('/fileStorage/signedUrl'));
		});

		it('return a signed url for putting blobs to', async () => {
			const context = setContext('0000d224816abba584714c8e');

			const { url, header } = await signedUrlService.create(
				{
					filename: 'test.txt',
					fileType: 'text/plain',
				},
				context
			);

			expect(url).to.be.equal('https://something.com');
			expect(header['Content-Type']).to.be.equal('text/plain');
			expect(header['x-amz-meta-name']).to.be.equal('test.txt');
		});

		it('return a signed url for putting blobs to a folder', (done) => {
			const context = setContext('0000d224816abba584714c8e');

			signedUrlService
				.create(
					{
						parent: '5ca613c4c7f5120b8c5bef36',
						filename: 'test.txt',
						fileType: 'text/plain',
					},
					context
				)
				.then(({ url, header }) => {
					expect(url).to.be.equal('https://something.com');
					expect(header['Content-Type']).to.be.equal('text/plain');
					expect(header['x-amz-meta-name']).to.be.equal('test.txt');
					done();
				});
		});

		it('should reject returning a signed url for not allowed folders', async () => {
			const context = setContext('0000d224816abba584714c8d');
			try {
				// this call should fail, because the user does not have write access
				// to the parent directory
				await signedUrlService.create(
					{
						parent: '5ca613c4c7f5120b8c5bef36',
						filename: 'test.txt',
						fileType: 'text/plain',
					},
					context
				);
				throw new Error('This should not happen.');
			} catch (err) {
				expect(err.code).to.be.equal(403);
			}
		});

		it('return a signed url for downloading a file', (done) => {
			const context = setContext('0000d224816abba584714c8e');

			signedUrlService
				.find({
					query: {
						file: '5ca613c4c7f5120b8c5bef33',
					},
					...context,
				})
				.then(({ url }) => {
					expect(url).to.be.equal('https://something.com');
					done();
				});
		});

		it('reject a signed url for downloading a file if no permissions', (done) => {
			const context = setContext('0000d224816abba584714c8d');

			signedUrlService
				.find({
					query: {
						file: '5ca613c4c7f5120b8c5bef33',
					},
					...context,
				})
				.then(({ code }) => {
					expect(code).to.be.equal(403);
					return done();
				});
		});

		it('return a signed url for updating blobs a file', (done) => {
			const context = setContext('0000d224816abba584714c8e');

			signedUrlService.patch('5ca613c4c7f5120b8c5bef33', {}, context).then(({ url }) => {
				expect(url).to.be.equal('https://something.com');
				done();
			});
		});

		it('reject a signed url for updating blobs a file if no permissions', (done) => {
			const context = setContext('0000d224816abba584714c8d');

			signedUrlService.patch('5ca613c4c7f5120b8c5bef33', {}, context).then(({ code }) => {
				expect(code).to.be.equal(403);
				return done();
			});
		});

		it('should not allow any of these files', () => {
			const fileNames = ['desktop.ini', 'Desktop.ini', 'Thumbs.db', 'schul-cloud.msi', '.DS_Store', 'tempFile*'];

			const promises = fileNames.map((filename) =>
				signedUrlService
					.create(
						{ filename, fileType: 'text/html' },
						{
							payload: { userId: '0000d213816abba584714c0a' },
							account: { userId: '0000d213816abba584714c0a' },
						}
					)
					.then(() => {
						throw new Error('This should not have happened!');
					})
					.catch((err) => {
						expect(err.name).to.equal('BadRequest');
						expect(err.code).to.equal(400);
						expect(err.message).to.equal(`Die Datei '${filename}' ist nicht erlaubt!`);
					})
			);

			return Promise.all(promises);
		});

		it('allows to override the internal file name with a request specific one', async () => {
			const context = setContext('0000d224816abba584714c8e');
			const requestedName = encodeURIComponent('some name-12345678id.png');
			const spy = sinon.spy(AWSStrategy.prototype, 'getSignedUrl');

			try {
				await signedUrlService.find({
					query: {
						file: '5ca613c4c7f5120b8c5bef33',
						name: requestedName,
					},
					...context,
				});
				expect(spy.calledWithMatch({ localFileName: requestedName })).to.equal(true);
			} finally {
				spy.restore();
			}
		});
	});

	describe('directory service', () => {
		it('registered the directory service', () => {
			assert.ok(app.service('fileStorage/directories'));
		});

		it('should not allow any of these folders', () => {
			const folderNames = ['C_drive', 'Windows', '.3T', '$WINDOWSBD', ' ', 'k_drive', 'Temporary Items'];

			const promises = folderNames.map((name) =>
				directoryService
					.create(
						{
							name,
							owner: '0000d213816abba584714c0a',
						},
						{
							payload: { userId: '0000d213816abba584714c0a' },
							account: { userId: '0000d213816abba584714c0a' },
						}
					)
					.catch((err) => {
						expect(err.name).to.equal('BadRequest');
						expect(err.code).to.equal(400);
						expect(err.message).to.equal(`Der Ordner '${name}' ist nicht erlaubt!`);
					})
			);

			return Promise.all(promises);
		});
	});

	it('registered the directory rename service', () => {
		assert.ok(app.service('fileStorage/directories/rename'));
	});

	it('registered the file rename service', () => {
		assert.ok(app.service('fileStorage/rename'));
	});

	it('registered the bucket service', () => {
		assert.ok(app.service('/fileStorage/files/new'));
	});

	it('registered the bucket service', () => {
		assert.ok(app.service('/fileStorage/permission'));
	});
});
