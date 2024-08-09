/* eslint-disable import/extensions */
import feathersAuthConfig = require('../../../src/services/authentication/configuration');

export { BruteForcePrevention } from '../../../src/errors/index.js';
export {
	addTokenToWhitelist,
	createRedisIdentifierFromJwtData,
	ensureTokenIsWhitelisted,
} from '../../../src/services/authentication/logic/whitelist.js';
export * as feathersRedis from '../../../src/utils/redis.js';

/*
	TODO: look at existing keys, vs implemented keys
	support: true,
	supportUserId,
	accountId,
	userId,
	iat,
	exp,
	aud: this.aud,
	iss: 'feathers',
	sub: accountId,
	jti: `support_${ObjectId()}`,
*/
export interface JwtConstants {
	secret: string;
	jwtOptions: {
		header: Header;
		audience: string;
		issuer: string;
		algorithm: string;
		expiresIn: string;
	};
}

interface Header {
	typ: string;
}

const mapFeatherAuthConfigToJwtConstants = (externalAuthConfig: unknown): JwtConstants => {
	if (typeof externalAuthConfig !== 'object' || externalAuthConfig === null) {
		throw new Error('externalAuthConfig must be a non-null object');
	}

	if (!('authConfig' in externalAuthConfig)) {
		throw new Error('externalAuthConfig must have the property authConfig');
	}

	const { authConfig } = externalAuthConfig;

	if (typeof authConfig !== 'object' || authConfig === null) {
		throw new Error('authConfig must be a non-null object');
	}

	if (!('secret' in authConfig)) {
		throw new Error('externalAuthConfig must have the property authConfig');
	}

	if (typeof authConfig.secret !== 'string') {
		throw new Error('Invalid type for secret');
	}

	if (authConfig.secret === null || authConfig === undefined) {
		throw new Error('Invalid value for secret');
	}

	if (!('jwtOptions' in authConfig)) {
		throw new Error('authConfig must have the property jwtOptions');
	}

	const { jwtOptions } = authConfig;

	if (typeof jwtOptions !== 'object' || jwtOptions === null) {
		throw new Error('jwtOptions must be a non-null object');
	}

	if (!('header' in jwtOptions)) {
		throw new Error('jwtOptions must have the property header');
	}

	const { header } = jwtOptions;

	if (typeof header !== 'object' || header === null) {
		throw new Error('header must be a non-null object');
	}

	if (!('typ' in header)) {
		throw new Error('header must have the property typ');
	}

	function isHeader(unknownObject: unknown): unknownObject is Header {
		if (typeof unknownObject !== 'object' || unknownObject === null) {
			return false;
		}

		if (!('typ' in unknownObject)) {
			throw new Error('header must have the property typ');
		}

		return typeof unknownObject.typ === 'string';
	}

	if (!isHeader(header)) {
		throw new Error('Invalid type for typ');
	}

	if (header.typ === null || header.typ === undefined) {
		throw new Error('Invalid value for typ');
	}

	if (!('audience' in jwtOptions)) {
		throw new Error('jwtOptions must have the property audience');
	}

	if (typeof jwtOptions.audience !== 'string') {
		throw new Error('Invalid type for audience');
	}

	if (jwtOptions.audience === null || jwtOptions.audience === undefined) {
		throw new Error('Invalid value for audience');
	}

	if (!('issuer' in jwtOptions)) {
		throw new Error('jwtOptions must have the property issuer');
	}

	if (typeof jwtOptions.issuer !== 'string') {
		throw new Error('Invalid type for issuer');
	}

	if (jwtOptions.issuer === null || jwtOptions.issuer === undefined) {
		throw new Error('Invalid value for issuer');
	}

	if (!('algorithm' in jwtOptions)) {
		throw new Error('jwtOptions must have the property algorithm');
	}

	if (typeof jwtOptions.algorithm !== 'string') {
		throw new Error('Invalid type for algorithm');
	}

	if (jwtOptions.algorithm === null || jwtOptions.algorithm === undefined) {
		throw new Error('Invalid value for algorithm');
	}

	if (!('expiresIn' in jwtOptions)) {
		throw new Error('jwtOptions must have the property expiresIn');
	}

	if (typeof jwtOptions.expiresIn !== 'string') {
		throw new Error('Invalid type for expiresIn');
	}

	if (jwtOptions.expiresIn === null || jwtOptions.expiresIn === undefined) {
		throw new Error('Invalid value for expiresIn');
	}

	return {
		secret: authConfig.secret,
		jwtOptions: {
			header,
			audience: jwtOptions.audience,
			issuer: jwtOptions.issuer,
			algorithm: jwtOptions.algorithm,
			expiresIn: jwtOptions.expiresIn,
		},
	};
};

export const jwtConstants: JwtConstants = mapFeatherAuthConfigToJwtConstants(feathersAuthConfig);
