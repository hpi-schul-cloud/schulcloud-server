/* eslint-disable max-classes-per-file */
const CryptoJS = require('crypto-js');

const { authenticate } = require('@feathersjs/authentication');
const { ObjectId } = require('mongoose').Types;

const { BadRequest } = require('../../../errors');
const { hasPermission } = require('../../../hooks/index');
const { authenticationSecret, audience: audienceName } = require('../../authentication/logic');
const accountModel = require('../model');
const logger = require('../../../logger');

const { getRedisClient } = require('../../../utils/redis');
const {
	addTokenToWhitelist,
	createRedisIdentifierFromJwtToken
} = require('../../authentication/logic/whitelist');

const DEFAULT_EXPIRED = 60 * 60 * 1000; // in ms => 1h
const DEFAULT_AUDIENCE = 'https://hpi-schul-cloud.de'; // The organisation that create this jwt.

class JWT {
	/**
	 * @param {String} secret The server jwt secret.
	 * @param {String} [audience] Name of jwt creator.
	 * @param {Number} [expiredOffset] The jwt expire time in ms.
	 */
	constructor(secret, audience = DEFAULT_AUDIENCE, expiredOffset = DEFAULT_EXPIRED) {
		this.secret = secret;
		this.aud = audience;
		this.expiredOffset = expiredOffset;
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

	HmacSHA256(signature, _secret) {
		const secret = _secret || this.secret;
		if (!secret) {
			throw new Error('No secret is defined.');
		}
		return CryptoJS.HmacSHA256(signature, secret);
	}

	async create(supportUserId, userData, secret) {
		const header = {
			alg: 'HS256',
			typ: 'access',
		};

		const iat = new Date().valueOf();
		const exp = iat + this.expiredOffset;

		const jwtData = {
			...userData,
			support: true, // mark for support jwts
			supportUserId,
			iat,
			exp,
			aud: this.aud,
			iss: 'feathers',
			sub: userData.accountId,
			jti: `support_${ObjectId()}`,
		};

		const stringifiedHeader = this.Utf8Stringify(header);
		const encodedHeader = this.base64url(stringifiedHeader);

		const stringifiedData = this.Utf8Stringify(jwtData);
		const encodedData = this.base64url(stringifiedData);

		let signature = `${encodedHeader}.${encodedData}`;
		signature = this.HmacSHA256(signature, secret); // algorithm: 'HS256',
		signature = this.base64url(signature);

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
	constructor(secret, audience = DEFAULT_AUDIENCE, expiredOffset = DEFAULT_EXPIRED) {
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
		const minutes = this.expiredOffset / (60 * 1000);
		// eslint-disable-next-line max-len
		logger.info(
			`[support][jwt] The support employee with the Id ${currentUserId} has created  a short live JWT for the user with the Id ${userId}. The JWT expires expires in ${minutes} minutes`
		);
	}

	async create({ userId }, params) {
		try {
			if (!userId) {
				throw new BadRequest(this.err.missingParams);
			}
			// eslint-disable-next-line no-param-reassign
			const requestedUserId = userId.toString();
			const currentUserId = params.account.userId.toString();

			const account = await accountModel.findOne({ userId }).select('_id').lean().exec();
			if (!account && !account._id) {
				throw new Error(`Account for user with the id ${userId} does not exist.`);
			}

			const userData = await this.app.service('authentication').getUserData(requestedUserId, account._id);
			const jwt = await this.jwt.create(currentUserId, userData);

			if (getRedisClient()) {
				const redisIdentifier = createRedisIdentifierFromJwtToken(jwt);
				await addTokenToWhitelist(redisIdentifier);
			}

			this.executeInfo(currentUserId, requestedUserId);
			return jwt;
		} catch (err) {
			logger.error(this.err.canNotCreateJWT, err);
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
