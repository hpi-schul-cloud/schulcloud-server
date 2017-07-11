'use strict';
const pathUtil = require('path').posix;
const hooks = require('./hooks');
const AWSStrategy = require('./strategies/awsS3');
const errors = require('feathers-errors');
const swaggerDocs = require('./docs/');
const filePermissionHelper = require('./utils/filePermissionHelper');
const removeLeadingSlash = require('./utils/leadingSlashHelper');
const FileModel = require('./model').fileModel;
const UserModel = require('../user/model');

const strategies = {
	awsS3: AWSStrategy
};

const createCorrectStrategy = (fileStorageType) => {
	const strategy = strategies[fileStorageType];
	if (!strategy) throw new errors.BadRequest("No file storage provided for this school");
	return new strategy();
};

class FileStorageService {
	constructor() {
		this.docs = swaggerDocs.fileStorageService
	}

	/**
	 * @param data, contains schoolId
	 * @returns {Promise}
	 */
	create(data, params) {
		return createCorrectStrategy(params.payload.fileStorageType).create(data.schoolId);
	}

	/**
	 * @returns {Promise}
	 * @param query contains the file path
	 * @param payload contains fileStorageType and userId, set by middleware
	 */
	find({query, payload}) {
		let path = query.path;
		console.log(path);
		let userId = payload.userId;
		return filePermissionHelper.checkPermissions(userId, path)
			.then(result => {
				// find all files for given path
				let filePromise = FileModel.find({path: path}).exec();
				let directoryPromise = FileModel.find({key: path}).exec();

				return Promise.all([filePromise, directoryPromise]).then(([files, directories]) => {
					return {
						files: files,
						directories: directories
					}
				});
			});
		//return createCorrectStrategy(payload.fileStorageType).getFiles(payload.userId, query.path);
	}

	/**
	 * @param params, contains storageContext and fileName in query
	 * @returns {Promise}
	 */
	remove(id, params) {
		return createCorrectStrategy(params.payload.fileStorageType).deleteFile(params.payload.userId, params.query.path);
	}
}

class SignedUrlService {
	constructor() {
		this.docs = swaggerDocs.signedUrlService;
	}

	/**
	 * @param path where to store the file
	 * @param fileType MIME type
	 * @param action the AWS action, e.g. putObject
	 * @returns {Promise}
	 */
	create({path, fileType, action}, params) {
		path = removeLeadingSlash(pathUtil.normalize(path)); // remove leading and double slashes
		let userId = params.payload.userId;

		// todo: convert path to flat storage!

		return filePermissionHelper.checkPermissions(userId, path).then(_ => {
			return createCorrectStrategy(params.payload.fileStorageType).generateSignedUrl(userId, path, fileType, action);
		});
	}
}

class DirectoryService {
	constructor() {
		this.docs = swaggerDocs.directoryService;
	}

	/**
	 * @param data, contains storageContext, dirName
	 * @returns {Promise}
	 */
	create(data, params) {
		return createCorrectStrategy(params.payload.fileStorageType).createDirectory(params.payload.userId, data.path);
	}

	/**
	 * @param params, {
			storageContext,
			dirName
		}
	 * @returns {Promise}
	 */
	remove(id, params) {
		return createCorrectStrategy(params.payload.fileStorageType)
			.deleteDirectory(params.payload.userId, params.query.path);
	}
}

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
	app.use('/fileStorage/directories', new DirectoryService());
	app.use('/fileStorage/signedUrl', new SignedUrlService());
	app.use('/fileStorage', new FileStorageService());

	// Get our initialize service to that we can bind hooks
	const fileStorageService = app.service('/fileStorage');
	const signedUrlService = app.service('/fileStorage/signedUrl');
	const directoryService = app.service('/fileStorage/directories');

	// Set up our before hooks
	fileStorageService.before(hooks.before);
	signedUrlService.before(hooks.before);
	directoryService.before(hooks.before);

	// Set up our after hooks
	fileStorageService.after(hooks.after);
	signedUrlService.after(hooks.after);
	directoryService.after(hooks.after);
};
