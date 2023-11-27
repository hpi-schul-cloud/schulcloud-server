import externalAuthConfig = require('../../../../../src/services/authentication/configuration');

const { authConfig } = externalAuthConfig;

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
		header: { typ: string };
		audience: string;
		issuer: string;
		algorithm: string;
		expiresIn: string;
	};
}

export const jwtConstants: JwtConstants = {
	secret: authConfig.secret as string,
	jwtOptions: authConfig.jwtOptions,
};
