/* eslint-disable max-classes-per-file */
/**
 * Provides a basic wopi - endpoint, https://wopirest.readthedocs.io/en/latest/index.html
 */
const rp = require('request-promise-native');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { Forbidden, NotFound, BadRequest } = require('../../errors');
const logger = require('../../logger');
const hooks = require('./hooks');
const { FileModel } = require('../fileStorage/model');
const { canWrite, canRead } = require('../fileStorage/utils/filePermissionHelper');
const hostCapabilitiesHelper = require('./utils/hostCapabilitiesHelper');
const filePostActionHelper = require('./utils/filePostActionHelper');
const handleResponseHeaders = require('../../middleware/handleResponseHeaders');

const wopiPrefix = '/wopi/files/';

/** Wopi-CheckFileInfo-Service
 * returns information about a file, a user’s permissions on that file,
 * and general information about the capabilities that the WOPI host has on the file.
 * https://wopirest.readthedocs.io/en/latest/files/CheckFileInfo.html
 */
class WopiFilesInfoService {
	constructor(app) {
		this.app = app;
	}

	find(params) {
		if (!(params.route || {}).fileId) {
			throw new BadRequest('No fileId exist.');
		}
		const { fileId } = params.route;
		const { userId } = params.account;
		const userService = this.app.service('users');
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
				if (!file) {
					throw new NotFound('The requested file was not found! (1)');
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

				return Promise.resolve(Object.assign(hostCapabilitiesHelper.defaultCapabilities(), capabilities));
			})
			.catch((err) => {
				logger.warning(new Error(err));
				return new Forbidden();
			});
	}

	// eslint-disable-next-line object-curly-newline
	create(data, { payload, _id, account, wopiAction }) {
		// check whether a valid file is requested
		return FileModel.findOne({ _id })
			.exec()
			.then((file) => {
				if (!file) {
					throw new NotFound('The requested file was not found! (2)');
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
	}

	/**
	 * retrieves a file`s binary contents
	 * https://wopirest.readthedocs.io/en/latest/files/GetFile.html
	 */
	find(params) {
		// {fileId: _id, payload, account}
		if (!(params.route || {}).fileId) {
			throw new BadRequest('No fileId exist.');
		}
		const { account, payload } = params;
		const { fileId } = params.route;
		const signedUrlService = this.app.service('fileStorage/signedUrl');

		// check whether a valid file is requested
		return FileModel.findOne({ _id: fileId })
			.exec()
			.then((file) => {
				if (!file) {
					throw new NotFound('The requested file was not found! (3)');
				}
				// generate signed Url for fetching file from storage
				return signedUrlService
					.find({
						query: {
							file: file._id,
						},
						payload,
						account,
					})
					.then((signedUrl) => {
						const opt = {
							uri: signedUrl.url,
							encoding: null,
						};
						return rp(opt).catch((err) => {
							logger.warning(new Error(err));
						});
					})
					.catch((err) => {
						logger.warning(new Error(err));
						return 'Die Datei konnte leider nicht geladen werden!';
					});
			})
			.catch((err) => {
				logger.warning(err);
				throw new NotFound('The requested file was not found! (4)');
			});
	}

	/*
	 * updates a file’s binary contents, file has to exist in proxy db
	 * https://wopirest.readthedocs.io/en/latest/files/PutFile.html
	 */
	create(data, params) {
		if (!(params.route || {}).fileId) {
			throw new BadRequest('No fileId exist.');
		}
		const { payload, account, wopiAction } = params;
		const { fileId } = params.route;
		if (wopiAction !== 'PUT') {
			throw new BadRequest('WopiFilesContentsService: Wrong X-WOPI-Override header value!');
		}

		const signedUrlService = this.app.service('fileStorage/signedUrl');

		// check whether a valid file is requested
		return FileModel.findOne({ _id: fileId }).then((file) => {
			if (!file) {
				throw new NotFound('The requested file was not found! (5)');
			}
			file.key = decodeURIComponent(file.key);

			// generate signedUrl for updating file to storage
			return signedUrlService
				.patch(file._id, {}, { payload, account })
				.then((signedUrl) => {
					// put binary content directly to file in storage
					const options = {
						method: 'PUT',
						uri: signedUrl.url,
						contentType: file.type,
						body: data,
					};

					return rp(options)
						.then(() =>
							FileModel.findOneAndUpdate(
								{ _id: file._id },
								{ $inc: { __v: 1 }, updatedAt: Date.now(), size: data.length }
							)
								.exec()
								.catch((err) => {
									logger.warning(new Error(err));
								})
						)
						.then(() => Promise.resolve({ lockId: file.lockId }))
						.catch((err) => {
							logger.warning(err);
						});
				})
				.catch((err) => {
					logger.warning(new Error(err));
				});
		});
	}
}

module.exports = function setup() {
	const app = this;

	app.use('/wopi/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));
	app.use(`${wopiPrefix}:fileId/contents`, new WopiFilesContentsService(app), handleResponseHeaders);
	app.use(`${wopiPrefix}:fileId`, new WopiFilesInfoService(app), handleResponseHeaders);

	const filesService = app.service(`${wopiPrefix}:fileId`);
	const filesContentService = app.service(`${wopiPrefix}:fileId/contents`);

	filesService.hooks(hooks);
	filesContentService.hooks(hooks);
};
