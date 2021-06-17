import externalAuthConfig = require('../../../../../src/services/authentication/configuration');

const { authConfig } = externalAuthConfig;

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
