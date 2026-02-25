/* eslint-disable import/extensions */
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

export { buildAllSearchableStringsForUser };
