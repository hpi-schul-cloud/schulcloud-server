import { TypeGuard } from '@shared/common';

export type Algorithms =
	| 'HS256'
	| 'HS384'
	| 'HS512'
	| 'RS256'
	| 'RS384'
	| 'RS512'
	| 'ES256'
	| 'ES384'
	| 'ES512'
	| 'PS256'
	| 'PS384'
	| 'PS512'
	| 'none';

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
export interface JwtConstants {
	secret: string;
	jwtOptions: {
		header: Header;
		audience: string;
		issuer: string;
		algorithm: Algorithms;
		expiresIn: string;
	};
}

interface Header {
	typ: string;
}

export class AuthConfigMapper {
	static mapFeathersAuthConfigToAuthConfig(externalAuthConfig: unknown): JwtConstants {
		TypeGuard.checkDefinedObject(externalAuthConfig);
		TypeGuard.isDefinedObject(externalAuthConfig);

		TypeGuard.checkKeyInObject(externalAuthConfig, 'secret');
		const secretUnknown = TypeGuard.getValueFromObjectKey(externalAuthConfig, 'secret');
		const secret = TypeGuard.checkString(secretUnknown);

		const jwtOptionsUnknown = TypeGuard.checkKeyInObject(externalAuthConfig, 'jwtOptions');
		const jwtOptions = TypeGuard.checkDefinedObject(jwtOptionsUnknown);

		const headerProp = TypeGuard.checkKeyInObject(jwtOptions, 'header');

		const typUnknown = TypeGuard.checkKeyInObject(headerProp, 'typ');
		const typ = TypeGuard.checkString(typUnknown);

		const audienceUnknown = TypeGuard.checkKeyInObject(jwtOptions, 'audience');
		const audience = TypeGuard.checkString(audienceUnknown);

		const issuerUnknown = TypeGuard.checkKeyInObject(jwtOptions, 'issuer');
		const issuer = TypeGuard.checkString(issuerUnknown);

		const algorithmUnknown = TypeGuard.checkKeyInObject(jwtOptions, 'algorithm');
		const algorithms: Algorithms[] = [
			'HS256',
			'HS384',
			'HS512',
			'RS256',
			'RS384',
			'RS512',
			'ES256',
			'ES384',
			'ES512',
			'PS256',
			'PS384',
			'PS512',
			'none',
		];
		const algorithm = TypeGuard.checkStringOfStrings<Algorithms>(algorithmUnknown, algorithms);

		const expiresInUnknown = TypeGuard.checkKeyInObject(jwtOptions, 'expiresIn');
		const expiresIn = TypeGuard.checkString(expiresInUnknown);

		return {
			secret,
			jwtOptions: {
				header: { typ },
				audience,
				issuer,
				algorithm,
				expiresIn,
			},
		};
	}
}
