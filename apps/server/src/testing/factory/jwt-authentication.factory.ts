import { Configuration } from '@hpi-schul-cloud/commons/lib';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { CreateJwtPayload } from '@infra/auth-guard';
import jwt, { Algorithm } from 'jsonwebtoken';

const privateKey = Configuration.get('JWT_PRIVATE_KEY') as string;
const domain = Configuration.get('SC_DOMAIN') as string;
const algorithm = Configuration.get('JWT_SIGNING_ALGORITHM') as Algorithm;

export class JwtAuthenticationFactory {
	public static createJwt(params: CreateJwtPayload): string {
		const validJwt = jwt.sign(
			{
				sub: params.accountId,
				iss: domain,
				aud: domain,
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
