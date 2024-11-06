import { TypeGuard } from '@shared/common';

export enum Algorithms {
	HS256 = 'HS256',
	HS384 = 'HS384',
	HS512 = 'HS512',
	RS256 = 'RS256',
	RS384 = 'RS384',
	RS512 = 'RS512',
	ES256 = 'ES256',
	ES384 = 'ES384',
	ES512 = 'ES512',
	PS256 = 'PS256',
	PS384 = 'PS384',
	PS512 = 'PS512',
	none = 'none',
}

/*
	TODO: look at existing keys, vs implemented keys
	support: true,
	supportUserId,
	accountId,
	userId,
	iat,
	exp,
	aud: this.aud,
	iss: 'feathers',
	sub: accountId,
	jti: `support_${ObjectId()}`,
*/

interface JwtOptionsHeader {
	typ: string;
	alg?: Algorithms;
}

export interface JwtOptions {
	header: JwtOptionsHeader;
	audience: string;
	issuer: string;
	algorithm: Algorithms;
	expiresIn: string;
	// keys are missing!
}

export interface JwtConstants {
	secret: string;
	jwtOptions: JwtOptions;
}

// Check if it not more a jwt factory and should be renamed and moved
export class AuthConfigFactory {
	public static build(secretInput: unknown, jwtOptionsInput: unknown): JwtConstants {
		const secret = TypeGuard.checkString(secretInput);
		// Should we add length check for secrets and that it is NOT secrets like for local?

		const jwtOptions = TypeGuard.checkKeysInObject(jwtOptionsInput, ['audience', 'issuer', 'expiresIn']);
		const audience = TypeGuard.checkString(jwtOptions.audience);
		const issuer = TypeGuard.checkString(jwtOptions.issuer);
		const expiresIn = TypeGuard.checkString(jwtOptions.expiresIn);

		const jwtConstants = {
			secret,
			jwtOptions: {
				header: { typ: 'access' }, // or should it be typ: 'JWT' ? alg ?
				audience,
				issuer,
				algorithm: Algorithms.HS256,
				expiresIn,
			},
		};

		return jwtConstants;
	}
}
