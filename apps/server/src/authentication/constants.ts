import { authConfig } from '../../../../src/services/authentication/configuration';
const { secret, jwtOptions } = authConfig;

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
	secret,
	jwtOptions,
};
