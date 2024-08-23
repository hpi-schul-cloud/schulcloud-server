import { Injectable } from '@nestjs/common';
import { ensureTokenIsWhitelisted } from '@src/imports-from-feathers';

@Injectable()
export class JwtValidationAdapter {
	/**
	 * When validating a jwt it must be added to a whitelist, here we check this.
	 * When the jwt is validated, the expiration time will be extended with this call.
	 * @param accountId users account id
	 * @param jti jwt id (here required to make jwt identifiers identical in redis)
	 */
	async isWhitelisted(accountId: string, jti: string): Promise<void> {
		await ensureTokenIsWhitelisted({ accountId, jti, privateDevice: false });
	}
}
