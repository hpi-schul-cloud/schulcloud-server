// import { authConfig as feathersAuthConfig } from '@src/imports-from-feathers'; TOOD: remove all
import { Configuration } from '@hpi-schul-cloud/commons';
import { AuthConfigFactory, JwtConstants } from '../mapper';

//  TODO: switch to nest config
const config: JwtConstants = {
	secret: Configuration.get('JWT_AUTHENTICATION_SECRET') as string,
	jwtOptions: {
		header: { typ: 'access' },
		audience: Configuration.get('JWT_AUD') as string,
		issuer: Configuration.get('JWT_AUD') as string,
		algorithm: 'HS256',
		expiresIn: Configuration.get('JWT_LIFETIME') as string, // TODO: How to handle support jwt life time?
	},
};

export const authConfig = AuthConfigFactory.build(config);
