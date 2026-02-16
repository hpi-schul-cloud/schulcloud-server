// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { CreateJwtPayload } from '@infra/auth-guard';
import { TestJwtModuleConfig } from '@testing/test-jwt-module.config';
import jwt from 'jsonwebtoken';

export class JwtAuthenticationFactory {
	public static createJwt(params: CreateJwtPayload, config: TestJwtModuleConfig): string {
		const { privateKey, algorithm, scDomain } = config;
		const validJwt = jwt.sign(
			{
				sub: params.accountId,
				iss: scDomain,
				aud: scDomain,
				jti: 'jti',
				iat: Date.now() / 1000,
				exp: (Date.now() + 1000000) / 1000,
				...params,
			},
			privateKey,
			{
				algorithm,
			}
		);
		return validJwt;
	}
}
