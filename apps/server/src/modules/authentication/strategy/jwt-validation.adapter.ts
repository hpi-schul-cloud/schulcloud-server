import { Injectable } from '@nestjs/common';

import jwtWhitelist from '../../../../../../src/services/authentication/logic/whitelist.js';

const { ensureTokenIsWhitelisted, addTokenToWhitelist, createRedisIdentifierFromJwtData } = jwtWhitelist;

@Injectable()
export class JwtValidationAdapter {
	/**
	 * When validating a jwt it must be added to a whitelist, here we check this.
	 * When the jwt is validated, the expiration time will be extended with this call.
	 * @param accountId users account id
	 * @param jti jwt id (here required to make jwt identifiers identical in redis)
	 */
	async isWhitelisted(accountId: string, jti: string): Promise<void> {
		await ensureTokenIsWhitelisted(false, { accountId, jti, privateDevice: false });
	}

	async addToWhitelist(accountId: string, jti: string): Promise<void> {
		const redisIdentifier = createRedisIdentifierFromJwtData(accountId, jti);
		await addTokenToWhitelist(redisIdentifier);
	}
}
