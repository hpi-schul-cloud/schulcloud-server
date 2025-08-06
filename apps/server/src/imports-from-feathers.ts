/* eslint-disable import/extensions */
import globals = require('../../../config/globals');

export { BruteForcePrevention } from '../../../src/errors/index.js';
export {
	addTokenToWhitelist,
	createRedisIdentifierFromJwtData,
	ensureTokenIsWhitelisted,
	getRedisData,
} from '../../../src/services/authentication/logic/whitelist.js';
export * as feathersRedis from '../../../src/utils/redis.js';
export type JwtRedisData = {
	IP: string;
	Browser: string;
	Device: string;
	privateDevice: boolean;
	expirationInSeconds: number;
};

interface GlobalConstants {
	DB_URL: string;
	DB_PASSWORD?: string;
	DB_USERNAME?: string;
}

const usedGlobals: GlobalConstants = globals;

/** Database URL */
export const { DB_URL, DB_PASSWORD, DB_USERNAME } = usedGlobals;

import { buildAllSearchableStringsForUser as _buildAllSearchableStringsForUserUntyped } from '../../../src/utils/search.js';

const buildAllSearchableStringsForUser = _buildAllSearchableStringsForUserUntyped as (
	firstName: string,
	lastName: string,
	email: string
) => string[];

export { buildAllSearchableStringsForUser };
