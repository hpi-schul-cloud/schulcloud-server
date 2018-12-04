'use strict';
/**
 * Provides a basic wopi - endpoint, https://wopirest.readthedocs.io/en/latest/index.html
 */
const hooks = require('./hooks');
const errors = require('feathers-errors');
const rp = require('request-promise-native');
const { FileModel } = require('../fileStorage/model');
const {
	canWrite,
	canRead,
} = require('../fileStorage/utils/filePermissionHelper');
const hostCapabilitiesHelper = require('./utils/hostCapabilitiesHelper');
const filePostActionHelper = require('./utils/filePostActionHelper');
const handleResponseHeaders = require('../../middleware/handleResponseHeaders');
const docs = require('./docs');

const wopiPrefix = '/wopi/files/';

/** Wopi-CheckFileInfo-Service
 * returns information about a file, a user’s permissions on that file, and general information about the capabilities that the WOPI host has on the file.
 * https://wopirest.readthedocs.io/en/latest/files/CheckFileInfo.html
 */
class WopiFilesInfoService {
	constructor(app) {
		this.app = app;
		this.docs = docs.wopiFilesInfoService;
	}

	find({fileId, account}) {
		const { userId } = account;
		const userService = this.app.service('users');
		
		// property descriptions: https://wopirest.readthedocs.io/en/latest/files/CheckFileInfo.html#required-response-properties
		let capabilities = {
			OwnerId: userId, // if an user passes the permission check, it's valid to handle it as file-owner
			UserId: userId,
		};

		// check whether a valid file is requested
		return FileModel.findOne({_id: fileId})
			.then(file => {
				if (!file) {
					throw new errors.NotFound("The requested file was not found!");
				}

				capabilities = {
					...capabilities,
					BaseFileName: file.name,
					Size: file.size,
					Version: file['__v'],
				};

				return canRead(userId, fileId);
			})
			.then(() => userService.get(userId))
			.then((user) => {

				capabilities = {
					...capabilities,
					UserFriendlyName: `${user.firstName} ${user.lastName}`,
				};

				return canWrite(userId, fileId).catch(() => undefined);
			})
			.then((canWrite) => {

				capabilities = {
					...capabilities,
					UserCanWrite: Boolean(canWrite),
				};

				return Promise.resolve(Object.assign(hostCapabilitiesHelper.defaultCapabilities(), capabilities));

			})
			.catch(() => new errors.Forbidden());
	}

	create(data, {payload, _id, account, wopiAction}) {
		// check whether a valid file is requested
		return FileModel.findOne({ _id }).then(file => {
			if (!file) throw new errors.NotFound("The requested file was not found!");

			// trigger specific action
			return filePostActionHelper(wopiAction)(file, payload, account, this.app);
		});
	}
}

/** Wopi-Get/PutFile-Service
 */
class WopiFilesContentsService {
	constructor(app) {
		this.app = app;
		this.docs = docs.wopiFilesContentsService;
	}
	
	/**
	 * retrieves a file`s binary contents
	 * https://wopirest.readthedocs.io/en/latest/files/GetFile.html 
	 */
  find({fileId: _id, payload, account}) {
		const signedUrlService = this.app.service('fileStorage/signedUrl');

		// check whether a valid file is requested
		return FileModel.findOne({ _id }).then(file => {
			if (!file) throw new errors.NotFound("The requested file was not found!");
			
			// generate signed Url for fetching file from storage
			return signedUrlService.find({
				query: {
					file: file._id,
				},
				payload,
				account
			}).then(signedUrl => {
				return rp({
					uri: signedUrl.url,
					encoding: null
				});
			});
		});
	}


	/*
	* updates a file’s binary contents, file has to exist in proxy db
	* https://wopirest.readthedocs.io/en/latest/files/PutFile.html
	*/
	create(data, {fileId, payload, account, wopiAction}) {
		if (wopiAction !== 'PUT') throw new errors.BadRequest("WopiFilesContentsService: Wrong X-WOPI-Override header value!");

		const signedUrlService = this.app.service('fileStorage/signedUrl');

		// check whether a valid file is requested
		return FileModel.findOne({_id: fileId}).then(file => {
			if (!file) throw new errors.NotFound("The requested file was not found!");

			// generate signedUrl for updating file to storage
			return signedUrlService.patch(
				file._id,
				{},
				{ payload, account }
			).then(signedUrl => {
				// put binary content directly to file in storage
				const options = {
					method: 'PUT',
					uri: signedUrl.url,
					contentType: file.type,
					body: data
				};

				return rp(options).then(_ => {
					return FileModel.findOneAndUpdate({_id: fileId}, {$inc: { __v: 1}, updatedAt: Date.now(), size: data.length}).exec();
				})
				.then(_ => Promise.resolve({lockId: file.lockId}));
			});
		});
	}
}

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
	app.use(wopiPrefix + ':fileId/contents', new WopiFilesContentsService(app), handleResponseHeaders);
	app.use(wopiPrefix + ':fileId', new WopiFilesInfoService(app), handleResponseHeaders);

	// Get our initialize service to that we can bind hooks
	const filesService = app.service(wopiPrefix + ':fileId');
	const filesContentService = app.service(wopiPrefix + ':fileId/contents');

	// Set up our before hooks
	filesService.before(hooks.before);
	filesContentService.before(hooks.before);

	// Set up our after hooks
	filesService.after(hooks.after);
	filesContentService.after(hooks.after);
};
