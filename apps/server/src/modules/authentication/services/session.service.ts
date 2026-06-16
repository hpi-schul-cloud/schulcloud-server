import { JwtPayloadVo } from '@infra/auth-guard';
import { JwtWhitelistAdapter } from '@infra/jwt-whitelist';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SessionService {
	constructor(private readonly jwtWhitelistAdapter: JwtWhitelistAdapter) {}

	public async extendSession(accessToken: string): Promise<number> {
		const { accountId, jti } = JwtPayloadVo.fromJwtToken(accessToken);

		await this.jwtWhitelistAdapter.addToWhitelist(accountId, jti);
		const expiresInSeconds = await this.jwtWhitelistAdapter.getTtl(accountId, jti);

		return expiresInSeconds;
	}
}
