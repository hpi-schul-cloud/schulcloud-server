import { AccountConfig } from '@modules/account';
import { XApiKeyConfig } from './config';
import { jwtConstants } from './constants';

// values copied from Algorithm definition. Type does not exist at runtime and can't be checked anymore otherwise
const algorithms = [
	'HS256',
	'HS384',
	'HS512',
	'RS256',
	'RS384',
	'RS512',
	'ES256',
	'ES384',
	'ES512',
	'PS256',
	'PS384',
	'PS512',
	'none',
];

if (!algorithms.includes(jwtConstants.jwtOptions.algorithm)) {
	throw new Error(`${jwtConstants.jwtOptions.algorithm} is not a valid JWT signing algorithm`);
}

export interface AuthenticationConfig extends AccountConfig, XApiKeyConfig {
	LOGIN_BLOCK_TIME: number;
}
