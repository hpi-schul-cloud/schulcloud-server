/* eslint-disable import/extensions */
import { Configuration } from '@hpi-schul-cloud/commons';
import { buildAllSearchableStringsForUser as _buildAllSearchableStringsForUserUntyped } from '../../../src/utils/search.js';

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

const buildAllSearchableStringsForUser = _buildAllSearchableStringsForUserUntyped as (
	firstName: string,
	lastName: string,
	email: string
) => string[];

/** Database URL */
const DB_URL = Configuration.get('DB_URL') as string;
const DB_PASSWORD = Configuration.get('DB_PASSWORD') as string;
const DB_USERNAME = Configuration.get('DB_USERNAME') as string;

export { buildAllSearchableStringsForUser, DB_PASSWORD, DB_URL, DB_USERNAME };
