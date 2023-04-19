import jwt from 'jsonwebtoken';
import crypto, { KeyPairKeyObjectResult } from 'crypto';

const keyPair: KeyPairKeyObjectResult = crypto.generateKeyPairSync('rsa', { modulusLength: 4096 });
const publicKey: string | Buffer = keyPair.publicKey.export({ type: 'pkcs1', format: 'pem' });
const privateKey: string | Buffer = keyPair.privateKey.export({ type: 'pkcs1', format: 'pem' });

interface CreateJwtParams {
	privateKey?: string | Buffer;
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
			params?.privateKey ?? privateKey,
			{
				algorithm: 'RS256',
			}
		);
		return validJwt;
	}
}
