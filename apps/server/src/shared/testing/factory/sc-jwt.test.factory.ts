import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { CreateJwtPayload } from '@src/infra/auth-guard';
import jwt from 'jsonwebtoken';

const publicKey: string = Configuration.get('JWT_PUBLIC_KEY') as string;
const privateKey: string = Configuration.get('JWT_PRIVATE_KEY') as string;

export class SCJwtTestFactory {
	public static getPublicKey(): string | Buffer {
		return publicKey;
	}

	public static createJwt(params: CreateJwtPayload): string {
		const validJwt = jwt.sign(
			{
				sub: 'testUser',
				iss: 'issuer',
				aud: 'audience',
				jti: 'jti',
				iat: Date.now() / 1000,
				exp: (Date.now() + 1000000) / 1000,
				external_sub: 'externalSub',
				...params,
			},
			privateKey,
			{
				algorithm: 'RS256',
			}
		);
		return validJwt;
	}

	public static check = (token: string): boolean => {
		try {
			jwt.verify(token, publicKey);
			return true;
		} catch (err) {
			return false;
		}
	};
}
