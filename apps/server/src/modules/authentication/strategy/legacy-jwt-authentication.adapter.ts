import { Injectable } from '@nestjs/common';

import appHooks = require('../../../../../../src/app.hooks.js');

const { ensureTokenIsWhitelisted } = appHooks;

@Injectable()
export class LegacyJwtAuthenticationAdapter {
	/**
	 * When validating a jwt it must be added to a whitelist, here we check this.
	 * When the jwt is validated, the expiration time will be extended with this call.
	 * @param accountId users account id
	 * @param jti jwt id (here required to make jwt identifiers identical in redis)
	 */
	async jwtIsWhitelisted(accountId: string, jti: string): Promise<void> {
		// TODO remove next line
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		await ensureTokenIsWhitelisted(false, { accountId, jti, privateDevice: false });
	}
}
