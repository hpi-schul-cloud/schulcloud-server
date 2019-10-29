const CryptoJS = require('crypto-js');
const { Forbidden, BadRequest } = require('@feathersjs/errors');
const { authenticate } = require('@feathersjs/authentication');
const decode = require('jwt-decode');
const { ObjectId } = require('mongoose').Types;

const accountModel = require('../model');
const logger = require('../../../logger');

const hooks = {};
hooks.before = {
	create: [authenticate('jwt')],
};

class SupportJWTService {
	/**
	 * @param {secret} authentication
	 */
	constructor(authentication, aud, expiredOffset) {
		this.authentication = authentication;
		this.err = {
			missingParams: 'Missing param userId.',
			noPermission: 'You have no permission to execute this.',
			canNotCreateJWT: 'Can not create support jwt.',
		};
		this.permission = 'CREATE_SUPPORT_JWT';
		this.aud = aud || 'https://schul-cloud.org';
		this.expiredOffset = expiredOffset || 3600;
	}

	getSetupHooks() {
		return hooks;
	}

	testAccess(requester) {
		const canPass = requester.userId.roles.some((r) => r.permissions.includes(this.permission));
		if (!canPass) {
			throw new Forbidden(this.err.noPermission);
		}
	}

	base64url(source) {
		// Encode in classical base64
		let encodedSource = CryptoJS.enc.Base64.stringify(source);

		// Remove padding equal characters
		encodedSource = encodedSource.replace(/=+$/, '');

		// Replace characters according to base64url specifications
		encodedSource = encodedSource.replace(/\+/g, '-');
		encodedSource = encodedSource.replace(/\//g, '_');

		return encodedSource;
	}

	Utf8Stringify(input) {
		return CryptoJS.enc.Utf8.parse(JSON.stringify(input));
	}

	HmacSHA256(signature, secret) {
		return CryptoJS.HmacSHA256(signature, secret);
	}

	// todo later add notification for user
	executeInfo(currentUserId, userId, exp) {
		// eslint-disable-next-line max-len
		logger.info(`The support employee with the Id ${currentUserId} has created  a short live JWT for the user with the Id ${userId}. The JWT expires at ${exp}.`);
	}

	async create({ userId }, params) {
		try {
			if (!userId) {
				throw new BadRequest(this.err.missingParams);
			}
			// eslint-disable-next-line no-param-reassign
			userId = userId.toString(); // validation for intern requests
			const currentUserId = params.account.userId.toString();

			const $populatedAccounts = await accountModel.find().or([
				{ userId: currentUserId },
				{ userId },
			]).select('userId')
				.populate({
					path: 'userId',
					populate: {
						path: 'roles',
					},
				})
				.exec();

			const populatedAccounts = $populatedAccounts.map((a) => a.toObject());
			const requester = populatedAccounts.find((a) => a.userId._id.toString() === currentUserId);
			const account = populatedAccounts.find((a) => a.userId._id.toString() === userId);

			// Important to restricted access!
			this.testAccess(requester);

			const header = {
				alg: 'HS256',
				typ: 'access',
			};

			const iat = new Date().valueOf();
			const exp = iat + this.expiredOffset;

			const accountId = account._id.toString();

			const jwtData = {
				support: true, // mark for support jwts
				accountId,
				userId,
				iat,
				exp,
				aud: this.aud,
				iss: 'feathers',
				sub: accountId,
				jti: `support_${ObjectId()}`,
			};

			const secret = this.authentication;

			const stringifiedHeader = this.Utf8Stringify(header);
			const encodedHeader = this.base64url(stringifiedHeader);

			const stringifiedData = this.Utf8Stringify(jwtData);
			const encodedData = this.base64url(stringifiedData);

			let signature = `${encodedHeader}.${encodedData}`;
			signature = this.HmacSHA256(signature, secret); // algorithm: 'HS256',
			signature = this.base64url(signature);

			const jwt = `${encodedHeader}.${encodedData}.${signature}`;

			this.executeInfo(currentUserId, userId, exp);
			return jwt;
		} catch (err) {
			logger.warning(this.err.canNotCreateJWT, err);
			return err;
		}
	}

	setup(app) {
		this.app = app;
	}
}

const supportJWTServiceSetup = (app) => {
	const path = 'accounts/supportJWT';
	const instance = new SupportJWTService(app.get('secrets').authentication);
	app.use(path, instance);
	const service = app.service(path);
	service.hooks(instance.getSetupHooks());
};

module.exports = {
	hooks,
	SupportJWTService,
	supportJWTServiceSetup,
};
