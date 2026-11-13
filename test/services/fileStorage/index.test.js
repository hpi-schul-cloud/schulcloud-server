const { expect } = require('chai');
const assert = require('assert');
const { ObjectId } = require('mongoose').Types;
const { v4: uuidv4 } = require('uuid');
const sinon = require('sinon');
const { Configuration } = require('@hpi-schul-cloud/commons');
const appPromise = require('../../../src/app');
const { FileModel, FileUploadIntentModel } = require('../../../src/services/fileStorage/model');
const { schoolModel } = require('../../../src/services/school/model');
const { userModel } = require('../../../src/services/user/model');
const RoleModel = require('../../../src/services/role/model');
const { teamsModel } = require('../../../src/services/teams/model');
const { courseModel } = require('../../../src/services/user-group/model');
const fixtures = require('./fixtures');

fixtures.schools[0].storageProvider = new ObjectId();

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

	getBucket(schoolId) {
		return `bucket-${schoolId}`;
	}

	getObjectMetadata({ flatFileName, uploadId, fileType }) {
		return Promise.resolve({
			ContentLength: 1200,
			ContentType: fileType,
			Metadata: {
				'upload-id': uploadId,
				name: encodeURIComponent('test.jpg'),
				'flat-name': encodeURIComponent(flatFileName),
			},
		});
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

		await Promise.all(promises);
		await schoolModel.updateOne(
			{ _id: fixtures.schools[0]._id },
			{ $set: { storageProvider: fixtures.schools[0].storageProvider } }
		).exec();
	});

	after(async () => {
		const promises = [
			...fixtures.users.map((user) => FileUploadIntentModel.deleteMany({ creator: user._id }).exec()),
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

	const createUploadIntent = async ({ userId, data }) => {
		const user = await userModel.findById(userId).lean().exec();
		const school = await schoolModel.findById(user.schoolId).lean().exec();

		return FileUploadIntentModel.create({
			creator: userId,
			owner: data.owner || userId,
			parent: data.parent,
			name: data.name,
			type: data.type,
			storageFileName: data.storageFileName,
			bucket: `bucket-${user.schoolId}`,
			storageProviderId: school.storageProvider,
			uploadId: uuidv4(),
			expiresAt: new Date(Date.now() + 60 * 1000),
		});
	};

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
		const createFileData = (owner) => ({
			...params,
			...(owner ? { owner } : {}),
			storageFileName: `storage-${uuidv4()}.jpg`,
		});

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

		it('should create a course file object', async () => {
			const context = setContext('0000d224816abba584714c8e');
			const data = createFileData('0000dcfbfb5c7a3f00bf21ac');
			await createUploadIntent({ userId: '0000d224816abba584714c8e', data });

			const res = await fileStorageService.create(data, context);
			const isEqual = ['name', 'type', 'size', 'storageFileName', 'thumbnail'].every(
				(key) => data[key].toString() === res[key].toString()
			);
			const { _id, isDirectory, refOwnerModel, permissions } = res;

			expect(permissions[0].refId.equals('0000d224816abba584714c8e')).to.be.true;
			expect(permissions).to.have.lengthOf(3);
			expect(refOwnerModel).to.be.equal('course');
			expect(isDirectory).to.be.false;
			expect(isEqual).to.be.true;

			created.push(_id);
		});

		it('should create a user file object', async () => {
			const context = setContext('0000d224816abba584714c8e');
			const data = createFileData();
			await createUploadIntent({ userId: '0000d224816abba584714c8e', data });

			const res = await fileStorageService.create(data, context);
			const isEqual = ['name', 'type', 'size', 'storageFileName', 'thumbnail'].every(
				(key) => data[key].toString() === res[key].toString()
			);
			const { _id, isDirectory, refOwnerModel, owner, permissions } = res;

			expect(refOwnerModel).to.be.equal('user');
			expect(permissions[0].refId.equals('0000d224816abba584714c8e')).to.be.true;
			expect(permissions).to.have.lengthOf(1);
			expect(owner.equals('0000d224816abba584714c8e')).to.be.true;
			expect(isDirectory).to.be.false;
			expect(isEqual).to.be.true;

			created.push(_id);
		});

		it('finalizes a root upload requested with a null parent', async () => {
			const context = setContext('0000d224816abba584714c8e');
			const { header } = await signedUrlService.create(
				{ parent: null, filename: 'test.jpg', fileType: 'image/jpg' },
				context
			);
			const storageFileName = decodeURIComponent(header['x-amz-meta-flat-name']);
			const intent = await FileUploadIntentModel.findOne({ storageFileName }).lean().exec();

			expect(intent).to.not.have.property('parent');

			const file = await fileStorageService.create(
				{ ...params, storageFileName },
				setContext('0000d224816abba584714c8e')
			);
			created.push(file._id);

			expect(file.storageFileName).to.equal(storageFileName);
			expect(await FileUploadIntentModel.findById(intent._id).lean().exec()).to.equal(null);
		});

		it('creates file metadata after the signed URL expires while the upload intent is still valid', async () => {
			const clock = sinon.useFakeTimers({ now: Date.now(), toFake: ['Date'] });
			try {
				const issuedAt = Date.now();
				const urlLifetime = Configuration.get('STORAGE_SIGNED_URL_EXPIRE') * 1000;
				const gracePeriod = Configuration.get('STORAGE_UPLOAD_FINALIZATION_GRACE_SECONDS') * 1000;
				const { header } = await signedUrlService.create(
					{ filename: 'test.jpg', fileType: 'image/jpg' },
					setContext('0000d224816abba584714c8e')
				);
				const storageFileName = decodeURIComponent(header['x-amz-meta-flat-name']);
				const intent = await FileUploadIntentModel.findOne({ storageFileName }).lean().exec();
				expect(intent.expiresAt.getTime()).to.equal(issuedAt + urlLifetime + gracePeriod);

				clock.tick(urlLifetime + 1);
				const file = await fileStorageService.create(
					{ ...params, storageFileName },
					setContext('0000d224816abba584714c8e')
				);
				created.push(file._id);

				expect(file.storageFileName).to.equal(storageFileName);
			} finally {
				clock.restore();
			}
		});

		it('rejects file metadata creation after the upload intent expires', async () => {
			const clock = sinon.useFakeTimers({ now: Date.now(), toFake: ['Date'] });
			try {
				const { header } = await signedUrlService.create(
					{ filename: 'test.jpg', fileType: 'image/jpg' },
					setContext('0000d224816abba584714c8e')
				);
				const storageFileName = decodeURIComponent(header['x-amz-meta-flat-name']);
				const intent = await FileUploadIntentModel.findOne({ storageFileName }).lean().exec();

				clock.setSystemTime(intent.expiresAt.getTime() + 1);
				await assert.rejects(
					fileStorageService.create(
						{ ...params, storageFileName },
						setContext('0000d224816abba584714c8e')
					),
					{ code: 403, message: 'No valid upload authorization was found for this file.' }
				);
				expect(await FileModel.exists({ storageFileName })).to.equal(null);
			} finally {
				clock.restore();
			}
		});

		it('persists the verified upload type instead of the submitted type', async () => {
			const context = setContext('0000d224816abba584714c8e');
			const data = { ...createFileData(), type: 'image/jpeg' };
			await createUploadIntent({ userId: '0000d224816abba584714c8e', data });

			const file = await fileStorageService.create({ ...data, type: 'text/html' }, context);
			created.push(file._id);

			const savedFile = await FileModel.findById(file._id).lean().exec();
			expect(savedFile.type).to.equal('image/jpeg');
		});

		it('rejects file metadata without an upload intent', async () => {
			const context = setContext('0000d224816abba584714c8e');
			try {
				await fileStorageService.create({ ...params, storageFileName: 'unknown-object' }, context);
				throw new Error('Expected file creation to be rejected');
			} catch (error) {
				expect(error.code).to.equal(403);
			}
		});

		it('rejects metadata when S3 object size does not match', async () => {
			const context = setContext('0000d224816abba584714c8e');
			const data = createFileData();
			await createUploadIntent({ userId: '0000d224816abba584714c8e', data });
			try {
				await fileStorageService.create({ ...data, size: 5 }, context);
				throw new Error('Expected file creation to be rejected');
			} catch (error) {
				expect(error.code).to.equal(400);
			}
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

		it('should move file to a new directory', (done) => {
			const context = setContext('0000d224816abba584714c8c');

			fileStorageService
				.patch(
					'5ca613c4c7f5120b8c5bef37',
					{
						parent: '5ca613c4c7f5120b8c5bef36',
					},
					context
				)
				.then(() => done());
		});

		it('should reject moving file without permission', (done) => {
			const context = setContext('0000d224816abba584714c8d');

			fileStorageService
				.patch(
					'5ca613c4c7f5120b8c5bef37',
					{
						parent: '5ca613c4c7f5120b8c5bef33',
					},
					context
				)
				.then(({ code }) => {
					expect(code).to.be.equal(403);
					return done();
				});
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
					flatFileName: 'chosen-object-key',
				},
				context
			);

			expect(url).to.be.equal('https://something.com');
			expect(header['Content-Type']).to.be.equal('text/plain');
			expect(header['x-amz-meta-name']).to.be.equal('test.txt');
			expect(header['x-amz-meta-upload-id']).to.match(/^[0-9a-f-]{36}$/);
			expect(header['x-amz-meta-flat-name']).to.match(/^[0-9a-f-]{36}-test\.txt$/);
			expect(header['x-amz-meta-flat-name']).to.not.equal('chosen-object-key');
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
