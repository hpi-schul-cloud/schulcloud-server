/**
 * Provides a basic wopi - endpoint, https://wopirest.readthedocs.io/en/latest/index.html
 */
const { Forbidden, BadRequest, NotFound } = require('@feathersjs/errors');
const rp = require('request-promise-native');
const logger = require('winston');
const hooks = require('./hooks');
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
 * returns information about a file, a user’s permissions on that file,
 * and general information about the capabilities that the WOPI host has on the file.
 * https://wopirest.readthedocs.io/en/latest/files/CheckFileInfo.html
 */
class WopiFilesInfoService {
	constructor(app) {
		this.app = app;
		this.docs = docs.wopiFilesInfoService;
	}

	find(params) { // {fileId, account}
		logger.info('find file', params);
		const { fileId } = params.route;
		const { userId } = params.account;
		const userService = this.app.service('users');
		logger.info('init file', { fileId, userId });
		// property descriptions:
		// https://wopirest.readthedocs.io/en/latest/files/CheckFileInfo.html#required-response-properties
		let capabilities = {
			OwnerId: userId, // if an user passes the permission check, it's valid to handle it as file-owner
			UserId: userId,
		};

		// check whether a valid file is requested
		return FileModel.findOne({ _id: fileId })
			.exec()
			.then((file) => {
				logger.info('file meta', {
					name: file.name, size: file.size, __v: file.__v,
				});
				if (!file) {
					throw new NotFound('The requested file was not found!');
				}

				capabilities = {
					...capabilities,
					BaseFileName: file.name,
					Size: file.size,
					Version: file.__v,
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
			.then((canWriteBool) => {
				capabilities = {
					...capabilities,
					UserCanWrite: Boolean(canWriteBool),
					UserCanNotWriteRelative: true,
				};
				logger.info('capabilities', capabilities, hostCapabilitiesHelper.defaultCapabilities());

				return Promise.resolve(Object.assign(hostCapabilitiesHelper.defaultCapabilities(), capabilities));
			})
			.catch((err) => {
				logger.warn(new Error(err));
				return new Forbidden();
			});
	}

	// eslint-disable-next-line object-curly-newline
	create(data, { payload, _id, account, wopiAction }) {
		logger.info('init file create', {
			data, payload, _id, account, wopiAction,
		});
		// check whether a valid file is requested
		return FileModel.findOne({ _id }).then((file) => {
			if (!file) {
				throw new NotFound('The requested file was not found!');
			}

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
	find(params) { // {fileId: _id, payload, account}
		logger.info('init content find');
		const { _id, account, payload } = params;
		const { fileId } = params.route;
		logger.info('init content', {
			_id, account, payload, fileId,
		});
		const signedUrlService = this.app.service('fileStorage/signedUrl');

		// check whether a valid file is requested
		return FileModel.findOne({ _id: fileId })
			.exec()
			.then((file) => {
				logger.info('fileId', file._id);
				if (!file) {
					throw new NotFound('The requested file was not found!');
				}
				// generate signed Url for fetching file from storage
				return signedUrlService.find({
					query: {
						file: file._id,
					},
					payload,
					account,
				}).then((signedUrl) => {
					logger.info('signedUrl content find', signedUrl);
					return rp({
						uri: signedUrl.url,
						encoding: null,
					}).catch((err) => {
						logger.warn('rp content find', new Error(err));
					});
				}).catch((err) => {
					logger.warn(new Error(err));
					return 'Die Datei konnte leider nicht geladen werden!';
				});
			})
			.catch((err) => {
				logger.warn('error content FileModel', err);
				throw new NotFound('The requested file was not found!');
			});
	}


	/*
	* updates a file’s binary contents, file has to exist in proxy db
	* https://wopirest.readthedocs.io/en/latest/files/PutFile.html
	*/
	create(data, params) {
		logger.info('init content create');
		const { payload, account, wopiAction } = params;
		const { fileId } = params.route;
		logger.info('init content create', {
			payload, account, wopiAction, fileId,
		});
		if (wopiAction !== 'PUT') {
			throw new BadRequest('WopiFilesContentsService: Wrong X-WOPI-Override header value!');
		}

		const signedUrlService = this.app.service('fileStorage/signedUrl');

		// check whether a valid file is requested
		return FileModel.findOne({ _id: fileId }).then((file) => {
			if (!file) {
				throw new NotFound('The requested file was not found!');
			}
			file.key = decodeURIComponent(file.key);
			logger.info({
				info: 'file', key: file.key, type: file.type, _id: file._id, name: file.name,
			});
			// generate signedUrl for updating file to storage
			return signedUrlService.patch(
				file._id,
				{},
				{ payload, account },
			).then((signedUrl) => {
				// put binary content directly to file in storage
				const options = {
					method: 'PUT',
					uri: signedUrl.url,
					contentType: file.type,
					body: data,
				};

				return rp(options)
					.then(
						() => FileModel.findOneAndUpdate(
							{ _id: file._id },
							{ $inc: { __v: 1 }, updatedAt: Date.now(), size: data.length },
						).exec().catch((err) => {
							logger.warn('findOneAndUpdate content create', new Error(err));
						}),
					)
					.then(() => Promise.resolve({ lockId: file.lockId }))
					.catch((err) => {
						logger.warn(err);
					});
			}).catch((err) => {
				logger.warn('error content signedUrlService', new Error(err));
			});
		});
	}
}

module.exports = function setup() {
	const app = this;

	app.use(`${wopiPrefix}:fileId/contents`, new WopiFilesContentsService(app), handleResponseHeaders);
	app.use(`${wopiPrefix}:fileId`, new WopiFilesInfoService(app), handleResponseHeaders);

	const filesService = app.service(`${wopiPrefix}:fileId`);
	const filesContentService = app.service(`${wopiPrefix}:fileId/contents`);

	filesService.hooks(hooks);
	filesContentService.hooks(hooks);
};
