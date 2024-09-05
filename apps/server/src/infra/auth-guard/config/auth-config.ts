import { Configuration } from '@hpi-schul-cloud/commons';
import { AuthConfigFactory } from '../mapper';

const config = {
	secret: Configuration.get('AUTHENTICATION') as string,
	jwtOptions: {
		audience: Configuration.get('JWT_AUD') as string,
		issuer: Configuration.get('JWT_AUD') as string,
		expiresIn: Configuration.get('JWT_LIFETIME') as string,
	},
};

export const authConfig = AuthConfigFactory.build(config);
