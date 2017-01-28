'use strict';
const hooks = require('./hooks');
const AWSStrategy = require('./strategies/awsS3');

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
				summary: 'Gets all files for the given context'
			}
		};
	}

	/**
	 * @param data, contains schoolId
	 * @returns {Promise}
	 */
	create(data) {
		return new AWSStrategy().create(data.schoolId); // todo: get strategy from school!
	}

	/**
	 * @param data, contains storageContext
	 * @returns {Promise}
	 */
	find(data) {
		return new AWSStrategy().getFiles(data.payload.userId, data.query.storageContext);
	}

	/**
	 * @param params, contains storageContext and fileName in query
     */
	remove(id, params) {
		return new AWSStrategy().deleteFile(params.payload.userId, params.query.storageContext, params.query.fileName);
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
	 * @param data, contains storageContext, fileName, fileType, action
	 * @returns {Promise}
	 */
	create(data, params) {
		return new AWSStrategy().generateSignedUrl(params.payload.userId, data.storageContext, data.fileName, data.fileType, data.action);
	}
}

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
	app.use('/fileStorage', new FileStorageService());
	app.use('/fileStorage/signedUrl', new SignedUrlService());

	// Get our initialize service to that we can bind hooks
	const fileStorageService = app.service('/fileStorage');
	const signedUrlService = app.service('/fileStorage/signedUrl');

	// Set up our before hooks
	fileStorageService.before(hooks.before);
	signedUrlService.before(hooks.before);

	// Set up our after hooks
	fileStorageService.after(hooks.after);
	signedUrlService.after(hooks.after);
};
