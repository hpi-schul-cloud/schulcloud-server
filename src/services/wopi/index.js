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

	async find(params) {
		if (!(params.route || {}).fileId) {
			throw new BadRequest('No fileId exist. (1)');
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

		try {
			const file = await FileModel.findOne({ _id: fileId }).lean().exec();
			if (!file) {
				throw new NotFound('The requested file was not found! (1)');
			}

			capabilities = {
				...capabilities,
				BaseFileName: file.name,
				Size: file.size,
				Version: file.__v,
			};

			await canRead(userId, fileId);

			const user = await userService.get(userId);

			capabilities = {
				...capabilities,
				UserFriendlyName: `${user.firstName} ${user.lastName}`,
			};

			const canWriteBool = await canWrite(userId, fileId).catch(() => undefined);

			capabilities = {
				...capabilities,
				UserCanWrite: Boolean(canWriteBool),
				UserCanNotWriteRelative: true,
			};

			return Object.assign(hostCapabilitiesHelper.defaultCapabilities(), capabilities);
		} catch (err) {
			throw new Forbidden('You has no access.', err);
		}
	}

	// eslint-disable-next-line object-curly-newline
	async create(data, { payload, account, wopiAction, route }) {
		// check whether a valid file is requested
		if (!(route || {}).fileId) {
			throw new BadRequest('No fileId exist. (2)');
		}
		const { fileId } = route;
		try {
			const file = await FileModel.findOne({ _id: fileId }).lean().exec();

			if (!file) {
				throw new NotFound('The requested file was not found!', { file });
			}
			// trigger specific action
			return filePostActionHelper(wopiAction)(file, payload, account, this.app);
		} catch (err) {
			throw new NotFound('The requested file was not found!', err);
		}
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
	async find(params) {
		// {fileId: _id, payload, account}
		if (!(params.route || {}).fileId) {
			throw new BadRequest('No fileId exist. (3)');
		}
		const { account, payload } = params;
		const { fileId } = params.route;
		const signedUrlService = this.app.service('fileStorage/signedUrl');

		try {
			// check whether a valid file is requested
			const file = await FileModel.findOne({ _id: fileId }).lean().exec();

			if (!file) {
				throw new NotFound('The requested file was not found! (3)');
			}

			const signedUrl = await signedUrlService.find({
				query: {
					file: file._id,
				},
				payload,
				account,
			});

			const opt = {
				uri: signedUrl.url,
				encoding: null,
			};

			return rp(opt);
		} catch (err) {
			throw new NotFound('The requested file was not found! (4)', err);
		}
	}

	/*
	 * updates a file’s binary contents, file has to exist in proxy db
	 * https://wopirest.readthedocs.io/en/latest/files/PutFile.html
	 */
	async create(data, params) {
		if (!(params.route || {}).fileId) {
			throw new BadRequest('No fileId exist. (4)');
		}
		const { payload, account, wopiAction } = params;
		const { fileId } = params.route;
		if (wopiAction !== 'PUT') {
			throw new BadRequest('WopiFilesContentsService: Wrong X-WOPI-Override header value!');
		}
		try {
			const signedUrlService = this.app.service('fileStorage/signedUrl');

			// check whether a valid file is requested
			const file = await FileModel.findOne({ _id: fileId }).lean().exec();

			if (!file) {
				throw new NotFound('The requested file was not found! (6)');
			}
			file.key = decodeURIComponent(file.key);

			const signedUrl = await signedUrlService.patch(file._id, {}, { payload, account });

			const options = {
				method: 'PUT',
				uri: signedUrl.url,
				contentType: file.type,
				body: data,
			};

			await rp(options);

			const patchData = { $inc: { __v: 1 }, updatedAt: Date.now(), size: data.length };
			await FileModel.findOneAndUpdate({ _id: file._id }, patchData).lean().exec();

			return { lockId: file.lockId };
		} catch (err) {
			throw new BadRequest('Can not execute wopi action.', err);
		}
	}
}

module.exports = (app) => {
	app.use('/wopi/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));
	app.use(`${wopiPrefix}:fileId/contents`, new WopiFilesContentsService(app), handleResponseHeaders);
	app.use(`${wopiPrefix}:fileId`, new WopiFilesInfoService(app), handleResponseHeaders);

	const filesService = app.service(`${wopiPrefix}:fileId`);
	const filesContentService = app.service(`${wopiPrefix}:fileId/contents`);

	filesService.hooks(hooks);
	filesContentService.hooks(hooks);
};
