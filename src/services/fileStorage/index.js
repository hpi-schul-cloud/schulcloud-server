'use strict';
const hooks = require('./hooks');
const AWSStrategy = require('./strategies/awsS3');
const errors = require('feathers-errors');

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
		this.docs = {
			description: 'A service to handle external file storages',
			create: {
				parameters: [
					{
						description: 'the id of the school the storage will be create',
						required: true,
						name: 'schoolId',
						type: 'string'
					}
				],
				summary: 'Creates a new storage for a given school',
				notes: 'Returns meta data of the created storage'
			},
			find: {
				parameters: [
					{
						description: 'the context of the file-storage',
						required: true,
						name: 'storageContext',
						type: 'string'
					}
				],
				summary: 'Gets all files and directories for the given context'
			},
			remove: {
				parameters: [
					{
						description: 'the storageContext in which the file is stored',
						required: true,
						name: 'storageContext',
						type: 'string'
					},
					{
						description: 'the name of the file which has to be deleted',
						required: true,
						name: 'fileName',
						type: 'string'
					}
				],
				summary: 'remove a file from a given storageContext'
			}
		};
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
		return createCorrectStrategy(payload.fileStorageType).getFiles(payload.userId, query.path);
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
		this.docs = {
			description: 'A service for generating signed urls, e.g. for uploading (action = putObject) and downloading files (action = getObject)',
			create: {
				parameters: [
					{
						description: 'the context of the file-storage',
						required: true,
						name: 'storageContext',
						type: 'string'
					},
					{
						description: 'the name of the file that will be uploaded',
						required: true,
						name: 'fileName',
						type: 'string'
					},
					{
						description: 'the mime type of the file that will be uploaded',
						required: true,
						name: 'fileType',
						type: 'string'
					}
				],
				summary: 'Creates a new signed url for the given file information and storage context',
				notes: 'Returns a url as string'
			}
		};
	}

	/**
	 * @param path where to store the file
	 * @param fileType MIME type
	 * @param action the AWS action, e.g. putObject
	 * @returns {Promise}
	 */
	create({path, fileType, action}, params) {
		return createCorrectStrategy(params.payload.fileStorageType).generateSignedUrl(params.payload.userId, path, fileType, action);
	}
}

class DirectoryService {
	constructor() {
		this.docs = {
			description: 'A service for handeling the directory structure',
			create: {
				parameters: [
					{
						description: 'the context of the file-storage',
						required: true,
						name: 'storageContext',
						type: 'string'
					},
					{
						description: 'the name of the directory that will be created',
						required: true,
						name: 'dirName',
						type: 'string'
					}
				],
				summary: 'Creates a folder for a given storageContext'
			},
			remove: {
				parameters: [
					{
						description: 'the context of the file-storage',
						required: true,
						name: 'storageContext',
						type: 'string'
					},
					{
						description: 'the name of the directory to be removed',
						required: true,
						name: 'dirName',
						type: 'string'
					}
				],
				summary: 'Removes a folder for a given storageContext'
			}
		};
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
