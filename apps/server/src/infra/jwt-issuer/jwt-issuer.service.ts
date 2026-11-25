import { type CreateJwtPayload } from '@infra/auth-guard';
import { JwtWhitelistAdapter } from '@infra/jwt-whitelist';
import { Injectable } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { randomUUID } from 'crypto';

@Injectable()
export class JwtIssuerService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly jwtWhitelistAdapter: JwtWhitelistAdapter
	) {}

	public async generateJwtAndAddToWhitelist(
		createJwtPayload: CreateJwtPayload,
		expiresIn: number | string
	): Promise<string> {
		const jti = randomUUID();
		const options: JwtSignOptions = {
			subject: createJwtPayload.accountId,
			jwtid: jti,
			expiresIn: expiresIn as JwtSignOptions['expiresIn'], // Overwrites the value from the JwtModuleOptions.
		};
		const accessToken = this.jwtService.sign(createJwtPayload, options);

		// Used legacy code and solve timeout in redis over JWT_EXTENDED_TIMEOUT_SECONDS
		await this.jwtWhitelistAdapter.addToWhitelist(createJwtPayload.accountId, jti);

		return accessToken;
	}
}
