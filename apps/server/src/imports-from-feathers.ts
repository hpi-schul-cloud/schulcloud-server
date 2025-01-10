/* eslint-disable import/extensions */
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
