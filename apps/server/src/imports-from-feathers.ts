import { buildAllSearchableStringsForUser as _buildAllSearchableStringsForUserUntyped } from '../../../src/utils/search.js';

export * as feathersRedis from '../../../src/utils/redis.js';

// LDAP sync runner (named export, can use ES6 import syntax)
export { runLegacyLdapSync } from '../../../src/services/sync/strategies/ldap-sync-runner.js';

const buildAllSearchableStringsForUser = _buildAllSearchableStringsForUserUntyped as (
	firstName: string,
	lastName: string,
	email: string
) => string[];

export { buildAllSearchableStringsForUser };
