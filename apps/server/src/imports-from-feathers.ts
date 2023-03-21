// import legacyAppPromise = require('../../../src/app.js');

export { BruteForcePrevention } from '../../../src/errors/index.js';
export * as feathersRedis from '../../../src/utils/redis.js';
export {
	ensureTokenIsWhitelisted,
	addTokenToWhitelist,
	createRedisIdentifierFromJwtData,
} from '../../../src/services/authentication/logic/whitelist.js';
// export const legacyApp = legacyAppPromise;
