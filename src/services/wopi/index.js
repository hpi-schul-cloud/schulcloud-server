'use strict';
/**
 * Provides a basic wopi - endpoint, https://wopirest.readthedocs.io/en/latest/index.html
 */
const hooks = require('./hooks');
const errors = require('feathers-errors');
const rp = require('request-promise-native');
const FileModel = require('../fileStorage/model').fileModel;
const filePermissionHelper = require('../fileStorage/utils/filePermissionHelper');

/** Wopi-CheckFileInfo-Service
 * returns information about a file, a user’s permissions on that file, and general information about the capabilities that the WOPI host has on the file.
 * https://wopirest.readthedocs.io/en/latest/files/CheckFileInfo.html
 * todo: host capabilities: https://wopirest.readthedocs.io/en/latest/files/CheckFileInfo.html#wopi-host-capabilities-properties, https://github.com/coatsy/wopi-node/blob/master/src/models/DetailedFile.ts
 */
class WopiFilesInfoService {
	get(fileId, {query, account, payload}) {
		// check whether a valid file is requested
		return FileModel.findOne({_id: fileId}).then(file => {
			if (!file) throw new errors.NotFound("Not a valid Schul-Cloud file!");

			// check for permissions
			return filePermissionHelper.checkPermissions(account.userId, file.path).then(_ => {
				return Promise.resolve({
					// property descriptions: https://wopirest.readthedocs.io/en/latest/files/CheckFileInfo.html#required-response-properties
					BaseFileName: file.name,
					OwnerId: account.userId, // if an user passes the permission check, it's valid to handle it as file-owner
					UserId: account.userId,
					Size: file.size,
					Version: file['__v']
				});
			});
		});
	}
}

/** Wopi-Get/PutFile-Service
 */
class WopiFilesContentsService {
	constructor(app) {
		this.app = app;
	}
	
	/**
	 * retrieves a file`s binary contents
	 * https://wopirest.readthedocs.io/en/latest/files/GetFile.html 
	 */
  find({query, fileId, payload, account}) {
		let signedUrlService = this.app.service('fileStorage/signedUrl');

		// check whether a valid file is requested
		return FileModel.findOne({_id: fileId}).then(file => {
			if (!file) throw new errors.NotFound("Not a valid Schul-Cloud file!");

			// generate signed Url for fetching file from storage
			return signedUrlService.create({
				path: file.key,
				fileType: file.type,
				action: 'getObject',
				userPayload: payload,
				account: account
			}).then(signedUrl => {
				// directly fetching file
				return rp(signedUrl.url);
			});
		});
	}


	/*
	* updates a file’s binary contents, file has to exist in proxy db
	* https://wopirest.readthedocs.io/en/latest/files/PutFile.html
	*/
	create(data, {query, fileId, payload, account}) {
		let signedUrlService = this.app.service('fileStorage/signedUrl');

		// check whether a valid file is requested
		return FileModel.findOne({_id: fileId}).then(file => {
			if (!file) throw new errors.NotFound("The requested file was not found!");

			// generate signedUrl for updating file to storage
			return signedUrlService.create({
				path: file.key,
				fileType: file.type,
				action: 'putObject',
				userPayload: payload,
				account: account,
				flatFileName: file.flatFileName
			}).then(signedUrl => {
				// put binary content directly to file in storage
				let options = {
					method: 'PUT',
					uri: signedUrl.url,
					body: data
				};

				return rp(options).then(_ => {
					return Promise.resolve(200);
				});
			});
		});
	}
}

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
	// todo: Refactor: Standardize wopi path-names (not to write every time) 
  app.use('/wopi/files/', new WopiFilesInfoService());
	app.use('/wopi/files/:fileId/contents', new WopiFilesContentsService(app));

	// Get our initialize service to that we can bind hooks
	const filesService = app.service('/wopi/files');
	const filesContentService = app.service('/wopi/files/:fileId/contents');

	// Set up our before hooks
	filesService.before(hooks.before);
	filesContentService.before(hooks.before);

	// Set up our after hooks
	filesService.after(hooks.after);
	filesContentService.after(hooks.after);
};
