import { Injectable } from '@nestjs/common';

import jwtWhitelist = require('../../../../../../src/services/authentication/logic/whitelist');

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
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		await ensureTokenIsWhitelisted({ accountId, jti, privateDevice: false });
	}

	async addToWhitelist(accountId: string, jti: string): Promise<void> {
		const redisIdentifier = createRedisIdentifierFromJwtData(accountId, jti);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		await addTokenToWhitelist(redisIdentifier);
	}
}
