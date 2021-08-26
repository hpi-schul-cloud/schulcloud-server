import { Injectable } from '@nestjs/common';

import jwtWhitelist = require('../../../../../../src/services/authentication/logic/whitelist');

const { ensureTokenIsWhitelisted } = jwtWhitelist;

@Injectable()
export class JwtValidationAdapter {
	/**
	 * When validating a jwt it must be added to a whitelist, here we check this.
	 * When the jwt is validated, the expiration time will be extended with this call.
	 * @param accountId users account id
	 * @param jti jwt id (here required to make jwt identifiers identical in redis)
	 */
	async isWhitelisted(accountId: string, jti: string): Promise<void> {
		// TODO remove next line
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		await ensureTokenIsWhitelisted(false, { accountId, jti, privateDevice: false });
	}
}
