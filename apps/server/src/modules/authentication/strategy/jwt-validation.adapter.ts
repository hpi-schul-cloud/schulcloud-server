import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import jwt, { JwtPayload } from 'jsonwebtoken';
import jwtWhitelist = require('../../../../../../src/services/authentication/logic/whitelist');

const { ensureTokenIsWhitelisted, addTokenToWhitelist, createRedisIdentifierFromJwtData } = jwtWhitelist;

@Injectable()
export class JwtValidationAdapter {
	constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

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

	async removeJwtFromWhitelist(accountId: string, jwtToken: string): Promise<void> {
		const decodedJwt: JwtPayload | null = jwt.decode(jwtToken, { json: true });
		if (decodedJwt && decodedJwt.jti) {
			const redisIdentifier: string = createRedisIdentifierFromJwtData(accountId, decodedJwt.jti);
			await this.cacheManager.del(redisIdentifier);
		}
	}
}
