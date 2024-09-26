import crypto, { KeyPairKeyObjectResult } from 'crypto';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

const keyPair: KeyPairKeyObjectResult = crypto.generateKeyPairSync('rsa', { modulusLength: 4096 });
const publicKey: string | Buffer = keyPair.publicKey.export({ type: 'pkcs1', format: 'pem' });
const privateKey: string | Buffer = keyPair.privateKey.export({ type: 'pkcs1', format: 'pem' });

interface CreateJwtParams {
	sub?: string;
	iss?: string;
	aud?: string;
	accountId?: string;
	external_sub?: string;
}

export class JwtTestFactory {
	public static getPublicKey(): string | Buffer {
		return publicKey;
	}

	public static createJwt(params?: CreateJwtParams): string {
		const validJwt = jwt.sign(
			{
				sub: params?.sub ?? 'testUser',
				iss: params?.iss ?? 'issuer',
				aud: params?.aud ?? 'audience',
				jti: 'jti',
				iat: Date.now(),
				exp: Date.now() + 100000,
				accountId: params?.accountId ?? 'accountId',
				external_sub: params?.external_sub ?? 'externalSub',
			},
			privateKey,
			{
				algorithm: 'RS256',
			}
		);
		return validJwt;
	}

	public static createLogoutToken(payload?: JwtPayload, options?: SignOptions): string {
		const validJwt = jwt.sign(
			{
				sub: 'testUser',
				iss: 'issuer',
				aud: 'audience',
				jti: 'jti',
				iat: Date.now(),
				exp: Date.now() + 100000,
				events: {
					'http://schemas.openid.net/event/backchannel-logout': {},
				},
				...payload,
			},
			privateKey,
			{
				algorithm: 'RS256',
				...options,
			}
		);

		return validJwt;
	}
}
