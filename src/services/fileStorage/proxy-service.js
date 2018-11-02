'use strict';

const { before, after } = require('./hooks');
const AWSStrategy = require('./strategies/awsS3');
const errors = require('feathers-errors');
const swaggerDocs = require('./docs/');
const {
	checkPermissions,
	canWrite,
	canRead,
	canCreate,
	canDelete,
} = require('./utils/filePermissionHelper');
const { generateFileNameSuffix: generateFlatFileName } = require('./utils/filePathHelper');
const FileModel = require('./model');
const { courseModel } = require('../user-group/model');

const strategies = {
	awsS3: AWSStrategy
};

const createCorrectStrategy = (fileStorageType) => {
	const strategy = strategies[fileStorageType];
	if (!strategy) throw new errors.BadRequest("No file storage provided for this school");
	return new strategy();
};

const sanitizeObj = obj => {
	Object.keys(obj).forEach(key => obj[key] === undefined && delete obj[key]);
	return obj;
};

const fileStorageService = {
	docs: swaggerDocs.fileStorageService,

	/**
	 * @param data, file data
	 * @param params, 
	 * @returns {Promise}
	 */
	async create(data, params) {
		const { payload: { userId } } = params;
		const { owner, parent } = data;
		let isCourse = true;

		if( owner ) {
			isCourse = Boolean(await courseModel.findOne({ _id: owner }).exec());
		}

		const props = sanitizeObj(Object.assign(data, {
			isDirectory: false,
			owner: owner || userId,
			parent,
			refOwnerModel: owner ? isCourse ? 'course' : 'teams' : 'user',
			permissions: [{
				refId: userId,
				refPermModel: 'user',
				write: true,
				read: true,
				create: true,
				delete: true,
			}]
		}));

		// create db entry for new file
		// check for create permissions on parent
		if( parent ) {
			return canCreate(userId, parent)
				.then(() => {
					return FileModel.findOne(props).exec().then(data => data ? Promise.resolve(data) : FileModel.create(props));
				})
				.catch(() => new errors.Forbidden());
		}

		return FileModel.findOne(props).exec().then(data => data ? Promise.resolve(data) : FileModel.create(props));
	},

	/**
	 * @returns {Promise}
	 * @param query contains the file path
	 * @param payload contains fileStorageType and userId and schoolId, set by middleware
	 */
	find({ query, payload }) {
		const { owner, parent } = query;
		const { userId } = payload;

		return FileModel.find({ owner, parent: parent || { $exists: false }}).exec()
			.then(files => {
				const permissionPromises = files.map(f => {
					return canRead(userId, f)
						.then(() => f)
						.catch(() => undefined);
				});
				return Promise.all(permissionPromises);
			});
	},

	/**
	 * @param params, contains storageContext and fileName in query
	 * @returns {Promise}
	 */
	remove(id, { query, payload }) {
		const { userId, fileStorageType } = payload;
		const { _id } = query;
		const fileInstance = FileModel.findOne({ _id });
		
		return canDelete(userId, _id)
			.then(() => fileInstance.exec())
			.then(file => {
				if( !file ) return Promise.resolve({});
				
				return createCorrectStrategy(fileStorageType).deleteFile(userId, file.storageFileName);
			})
			.then(() => fileInstance.remove().exec())
			.catch(() => new errors.Forbidden());
	},

	/**
	 * @param id, the file-id in the proxy-db
	 * @param data, contains fileName, path and destination. Path and destination have to have a slash at the end!
	 */
	patch(id, data, params) {
		let fileName = data.fileName;
		let path = data.path;
		let destination = data.destination;

		if (!id || !fileName || !path || !destination) return Promise.reject(new errors.BadRequest('Missing parameters'));

		let userId = params.payload.userId;
		return checkPermissions(userId, path + fileName)
			.then(_ => {
				// check destination permissions
				return checkPermissions(userId, destination + fileName)
					.then(_ => {
						// patch file direction in proxy db
						return FileModel.update({_id: id,}, {
							$set: {
								key: destination + fileName,
								path: destination
							}
						}).exec();
					});
			});
	},
};

const signedUrlService = {
	docs: swaggerDocs.signedUrlService,
	/**
	 * @param path where to store the file
	 * @param fileType MIME type
	 * @param action the AWS action, e.g. putObject
	 * @returns {Promise}
	 */
	create({ parent, filename, fileType }, params) {

		const { payload: { userId } } = params;
		const strategy = createCorrectStrategy(params.payload.fileStorageType);

		const parentPromise = parent ? FileModel.findOne({ parent, name: filename }).exec() : Promise.resolve({});

		return parentPromise.then(res => {

			const flatFileName = generateFlatFileName(filename);
			const permissionPromise = parent ? canCreate(userId, res._id) : Promise.resolve({});
			
			return permissionPromise.then(() => {

				let header =  {
					// add meta data for later using
					"Content-Type": fileType,
					"x-amz-meta-name": filename,
					"x-amz-meta-flat-name": flatFileName,
					"x-amz-meta-thumbnail": "https://schulcloud.org/images/login-right.png"
				};

				return strategy.generateSignedUrl({userId, flatFileName, fileType})
					.then(res => {
						return {
							url: res,
							header: header
						};
					});
			});
		});
	},
};

const directoryService = {

	docs: swaggerDocs.directoryService,

	/**
	 * @param { name, owner and parent }, params
	 * @returns {Promise}
	 */
	async create(data, params) {
		const { payload: { userId } } = params;
		const { name, owner, parent } = data;
		let isCourse = true;

		if( owner ) {
			isCourse = Boolean(await courseModel.findOne({ _id: owner }).exec());
		}

		const props = sanitizeObj({
			isDirectory: true,
			owner: owner || userId,
			name,
			parent,
			refOwnerModel: owner ? isCourse ? 'course' : 'teams' : 'user',
			permissions: [{
				refId: userId,
				refPermModel: 'user',
				write: true,
				read: true,
				create: true,
				delete: true,
			}]
		});

		// create db entry for new directory
		// check for create permissions if it is a subdirectory
		if( parent ) {
			return canCreate(userId, parent)
				.then(() => {
					return FileModel.findOne(props).exec().then(data => data ? Promise.resolve(data) : FileModel.create(props));
				})
				.catch(() => new errors.Forbidden());
		}

		return FileModel.findOne(props).exec().then(data => data ? Promise.resolve(data) : FileModel.create(props));
	},

	/**
	 * @param id, params
	 * @returns {Promise}
	 */
	remove(_id, params) {
		const { payload: { userId } } = params;
		const fileInstance = FileModel.findOne({ _id });

		return canDelete(userId, _id)
			.then(() => fileInstance.exec())
			.then(file => {
				if( !file ) return Promise.resolve({});
				return FileModel.find({ parent: _id }).remove().exec();
			})
			.then(() => fileInstance.remove().exec())
			.catch(() => new errors.Forbidden());
	},
};

const renameService = {

		docs: swaggerDocs.directoryRenameService,

		/**
		 * @param data, contains new name
		 * @returns {Promise}
		 */
		create(data, params) {
			const { payload: { userId } } = params;
			const { name, _id } = data;
			
			if (!_id || !name) return Promise.reject(new errors.BadRequest('Missing parameters'));

			return canWrite(userId, _id)
				.then(() => FileModel.findOne({ _id }).exec())
				.then(directory => {
					if (!directory) return Promise.reject(new errors.NotFound('The given directory/file was not found!'));
					return FileModel.update({ _id }, { name }).exec();
				});
		}
};

const fileTotalSizeService = {

	/**
	 * @returns total file size and amount of files
	 * @param payload contains fileStorageType and userId and schoolId, set by middleware
	 */
	find({ payload }) {
		return FileModel.find({owner: payload.schoolId}).exec()
			.then(files => ({
				total: files.length, 
				totalSize: files.reduce((sum, file) => {
					return sum + file.size;
				}),
			}));
	}
};

const bucketService = {
	/**
	 * @param data, contains schoolId
	 * @returns {Promise}
	 */
	create(data, params) {
		return createCorrectStrategy(params.payload.fileStorageType).create(data.schoolId);
	},
};

const copyService = {

	docs: swaggerDocs.copyService,

	/**
	 * @param data, contains oldPath, newPath and externalSchoolId (optional).
	 * @returns {Promise}
	 */
	create(data, params) {
		let {fileName, oldPath, newPath, externalSchoolId} = data;
		let userId = params.account.userId;

		if (!oldPath || !fileName || !newPath || !userId) {
			return Promise.reject(new errors.BadRequest('Missing parameters'));
		}

		// first check if given file is valid
		return FileModel.findOne({key: oldPath + fileName}).exec()
			.then(file => {
				if (!file) throw new errors.NotFound("The file was not found!");

				// check that there's no file on 'newPath', otherwise change name of file
				return FileModel.findOne({key: newPath + fileName}).exec()
					.then(newFile => {
						let newFileName = fileName;
						if (newFile) {
							let name = fileName.substring(0, fileName.lastIndexOf('.'));
							let extension = fileName.split('.').pop();
							newFileName = `${name}_${Date.now()}.${extension}`;
						}

						// check permissions for oldPath and newPath
						let oldPathPromise = checkPermissions(userId, oldPath + fileName);
						let newPathPromise = checkPermissions(userId, newPath + newFileName);

						return Promise.all([oldPathPromise, newPathPromise]).then(_ => {

							// copy file on external storage
							let newFlatFileName = generateFlatFileName(newFileName);
							return createCorrectStrategy(params.payload.fileStorageType).copyFile(userId, file.flatFileName, newFlatFileName, externalSchoolId).then(_ => {

								// create proxy object from copied;
								let newFileObject = {
									key: newPath + newFileName,
									path: newPath,
									name: decodeURIComponent(newFileName),
									type: file.type,
									size: file.size,
									flatFileName: newFlatFileName,
									thumbnail: file.thumbnail,
									schoolId: file.schoolId,
									permissions: file.permissions || []
								};

								return FileModel.create(newFileObject);
							});
						});
					});
			});
	}
};

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
	app.use('/fileStorage/directories', directoryService);
	app.use('/fileStorage/directories/rename', renameService);
	app.use('/fileStorage/rename', renameService);
	app.use('/fileStorage/signedUrl', signedUrlService);
	app.use('/fileStorage/bucket', bucketService);
	app.use('/fileStorage/total', fileTotalSizeService);
	app.use('/fileStorage/copy', copyService);
	app.use('/fileStorage', fileStorageService);

	[
		'/fileStorage',
		'/fileStorage/signedUrl',
		'/fileStorage/bucket',
		'/fileStorage/directories',
		'/fileStorage/directories/rename',
		'/fileStorage/rename',
		'/fileStorage/total',
		'/fileStorage/copy',
	].forEach(path => {
		// Get our initialize service to that we can bind hooks
		const service = app.service(path);
		service.before(before);
		service.after(after);
	});
};
