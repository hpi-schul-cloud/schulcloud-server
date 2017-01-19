'use strict';
const hooks = require('./hooks');
const AWSStrategy = require('./strategies/awsS3');

class FileStorageService {
	constructor() {
	}

	/**
	 * todo: swagger
	 * @param data, contains schoolId
	 * @returns {Promise}
	 */
	create(data) {
		return new AWSStrategy().create(data.schoolId); // todo: get strategy from school!
	}

	/**
	 * todo: swagger
	 * @param data, contains storageContext
	 * @returns {Promise}
	 */
	find(data) {
		return new AWSStrategy().getFiles(data.payload.userId, data.query.storageContext);
	}
}

class SignedUrlService {
	constructor() {
	}

	/**
	 * todo: swagger
	 * @param data, contains storageContext, fileName, fileType
	 * @returns {Promise}
	 */
	create(data, params) {
		return new AWSStrategy().generateSignedUrl(params.payload.userId, data.storageContext, data.fileName, data.fileType);
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
