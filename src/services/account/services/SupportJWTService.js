const CryptoJS = require('crypto-js');
const { Forbidden, BadRequest } = require('@feathersjs/errors');
const { authenticate } = require('@feathersjs/authentication');
const { ObjectId } = require('mongoose').Types;

const { hasPermission } = require('../../../hooks/index')
const { authenticationSecret, audience: audienceName } = require('../../authentication/logic');
const accountModel = require('../model');
const logger = require('../../../logger');

class JWT {
	/**
	 * @param {String} secret The server jwt secret.
	 * @param {String} [audience] Name of jwt creator.
	 * @param {Number} [expiredOffset] The jwt expire time in ms.
	 */
	constructor(secret, audience, expiredOffset) {
		this.secret = secret;
		this.aud = audience;
		this.expiredOffset = expiredOffset;
	}

	static base64url(source) {
		// Encode in classical base64
		let encodedSource = CryptoJS.enc.Base64.stringify(source);

		// Remove padding equal characters
		encodedSource = encodedSource.replace(/=+$/, '');

		// Replace characters according to base64url specifications
		encodedSource = encodedSource.replace(/\+/g, '-');
		encodedSource = encodedSource.replace(/\//g, '_');

		return encodedSource;
	}

	static Utf8Stringify(input) {
		return CryptoJS.enc.Utf8.parse(JSON.stringify(input));
	}

	static HmacSHA256(signature, secret) {
		return CryptoJS.HmacSHA256(signature, secret || this.secret);
	}

	async create(userId, secret) {
		const account = await accountModel.find({ userId }).select('_id').lean().exec();

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

		const stringifiedHeader = JWT.Utf8Stringify(header);
		const encodedHeader = JWT.base64url(stringifiedHeader);

		const stringifiedData = JWT.Utf8Stringify(jwtData);
		const encodedData = JWT.base64url(stringifiedData);

		let signature = `${encodedHeader}.${encodedData}`;
		signature = JWT.HmacSHA256(signature, secret); // algorithm: 'HS256',
		signature = JWT.base64url(signature);

		const jwt = `${encodedHeader}.${encodedData}.${signature}`;
		return jwt;
	}
}

const hooks = {};
hooks.before = {
	create: [authenticate('jwt'), hasPermission('CREATE_SUPPORT_JWT')],
};

class SupportJWTService {
	/**
	 * @param {String} secret The server jwt secret.
	 * @param {String} [audience] Name of jwt creator.
	 * @param {Number} [expiredOffset] The jwt expire time in ms.
	 */
	constructor(secret, audience = 'https://schul-cloud.org', expiredOffset = 3600) {
		this.err = Object.freeze({
			missingParams: 'Missing param userId.',
			canNotCreateJWT: 'Can not create support jwt.',
		});

		this.jwt = new JWT(secret, audience, expiredOffset);
		this.expiredOffset = expiredOffset;
	}

	static getSetupHooks() {
		return hooks;
	}

	// todo later add notification for user
	executeInfo(currentUserId, userId) {
		// eslint-disable-next-line max-len
		logger.info(`[support][jwt] The support employee with the Id ${currentUserId} has created  a short live JWT for the user with the Id ${userId}. The JWT expires at ${this.expiredOffset}.`);
	}

	async create({ userId }, params) {
		try {
			if (!userId) {
				throw new BadRequest(this.err.missingParams);
			}
			// eslint-disable-next-line no-param-reassign
			userId = userId.toString(); // validation for intern requests
			const currentUserId = params.account.userId.toString();

			const jwt = await this.jwt.create();

			this.executeInfo(currentUserId, userId);
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
	const instance = new SupportJWTService(authenticationSecret, audienceName);
	app.use(path, instance);
	const service = app.service(path);
	service.hooks(SupportJWTService.getSetupHooks());
};

module.exports = {
	hooks,
	SupportJWTService,
	supportJWTServiceSetup,
	JWT,
};
