/* eslint-disable import/extensions */
import { buildAllSearchableStringsForUser as _buildAllSearchableStringsForUserUntyped } from '../../../src/utils/search.js';

export {
	createRedisIdentifierFromJwtData,
	ensureTokenIsWhitelisted,
	getRedisData,
} from '../../../src/services/authentication/logic/whitelist.js';
export * as feathersRedis from '../../../src/utils/redis.js';

// Legacy app bootstrap
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
export const legacyAppPromise = require('../../../src/app');

// LDAP sync runner (named export, can use ES6 import syntax)
export { runLegacyLdapSync } from '../../../src/services/sync/strategies/ldap-sync-runner.js';

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
