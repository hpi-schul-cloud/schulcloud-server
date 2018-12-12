'use strict';
/**
 * Provides a basic wopi - endpoint, https://wopirest.readthedocs.io/en/latest/index.html
 */
const hooks = require('./hooks');
const errors = require('feathers-errors');
const rp = require('request-promise-native');
const FileModel = require('../fileStorage/model').fileModel;
const filePermissionHelper = require('../fileStorage/utils/filePermissionHelper');
const hostCapabilitiesHelper = require('./utils/hostCapabilitiesHelper');
const filePostActionHelper = require('./utils/filePostActionHelper');
const handleResponseHeaders = require('../../middleware/handleResponseHeaders');
const UserModel = require('../user/model').userModel;
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
		// check whether a valid file is requested
		return FileModel.findOne({_id: fileId}).then(file => {
			if (!file) throw new errors.NotFound("The requested file was not found!");

			let splitPath = file.path.split('/');
			let isCourse = splitPath[0] == 'courses';
			let userService = this.app.service('users');

			// check for permissions
			return filePermissionHelper.checkPermissions(account.userId, file.key, ["can-read", "can-write"], true, {key: file.key, shareToken: file.shareToken}).then(_ => {
				return userService.get(account.userId, { query: { $populate: 'roles'}}).then(user => {
					let isTeacher = false;

					user.roles.map(role => {
						if (role.name === 'teacher')
							isTeacher = true;
					});

					let canWrite = true;

					if (isCourse && !isTeacher && !file.studentCanEdit)
						canWrite = false;

				return Promise.resolve(Object.assign(hostCapabilitiesHelper.defaultCapabilities(), {
					// property descriptions: https://wopirest.readthedocs.io/en/latest/files/CheckFileInfo.html#required-response-properties
					BaseFileName: file.name,
					OwnerId: account.userId, // if an user passes the permission check, it's valid to handle it as file-owner
					UserId: account.userId,
					Size: file.size,
					Version: file['__v'],
					UserFriendlyName: `${user.firstName} ${user.lastName}`,
					UserCanWrite: canWrite,
					UserCanNotWriteRelative: true
				}));
			});
			});
		});
	}

	create(data, {payload, fileId, account, wopiAction}) {
		// check whether a valid file is requested
		return FileModel.findOne({_id: fileId}).then(file => {
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
  find({fileId, payload, account}) {
		let signedUrlService = this.app.service('fileStorage/signedUrl');

		// check whether a valid file is requested
		return FileModel.findOne({_id: fileId}).then(file => {
			if (!file) throw new errors.NotFound("The requested file was not found!");
			file.key = decodeURIComponent(file.key);

			// generate signed Url for fetching file from storage
			return signedUrlService.create({
				path: file.key,
				fileType: file.type,
				action: 'getObject',
				userPayload: payload,
				account: account
			}).then(signedUrl => {
				
				// directly fetching file
				let options = {
					uri: signedUrl.url,
					encoding: null
				};

				return rp(options);
			});
		});
	}


	/*
	* updates a file’s binary contents, file has to exist in proxy db
	* https://wopirest.readthedocs.io/en/latest/files/PutFile.html
	*/
	create(data, {fileId, payload, account, wopiAction}) {
		if (wopiAction !== 'PUT') throw new errors.BadRequest("Wrong X-WOPI-Override header value!");

		let signedUrlService = this.app.service('fileStorage/signedUrl');

		// check whether a valid file is requested
		return FileModel.findOne({_id: fileId}).then(file => {
			if (!file) throw new errors.NotFound("The requested file was not found!");
			file.key = decodeURIComponent(file.key);

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
					return FileModel.findOneAndUpdate({_id: fileId}, {$inc: { __v: 1}, updatedAt: Date.now(), size: data.length}).exec()
						.then(_ => {
							return Promise.resolve({lockId: file.lockId});
						});
				});
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
