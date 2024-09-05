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
	public static build(externalAuthConfig: unknown): JwtConstants {
		TypeGuard.checkDefinedObject(externalAuthConfig);
		TypeGuard.isDefinedObject(externalAuthConfig);

		TypeGuard.checkKeyInObject(externalAuthConfig, 'secret');
		const secretUnknown = TypeGuard.getValueFromObjectKey(externalAuthConfig, 'secret');
		const secret = TypeGuard.checkString(secretUnknown);

		// Should we add length check for secrets and that it is NOT secrets like for local?

		const jwtOptionsUnknown = TypeGuard.checkKeyInObject(externalAuthConfig, 'jwtOptions');
		const jwtOptions = TypeGuard.checkDefinedObject(jwtOptionsUnknown);

		const audienceUnknown = TypeGuard.checkKeyInObject(jwtOptions, 'audience');
		const audience = TypeGuard.checkString(audienceUnknown);
		// IMPORTANT every change of audience and issuer has impact of jwt validation, depend on situation.
		// I do it in this PR, but maybe it should be changed first in Part 3 of this tickets.
		// We must speak by review about it.

		const issuerUnknown = TypeGuard.checkKeyInObject(jwtOptions, 'issuer');
		const issuer = TypeGuard.checkString(issuerUnknown);

		const expiresInUnknown = TypeGuard.checkKeyInObject(jwtOptions, 'expiresIn');
		const expiresIn = TypeGuard.checkString(expiresInUnknown);

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
