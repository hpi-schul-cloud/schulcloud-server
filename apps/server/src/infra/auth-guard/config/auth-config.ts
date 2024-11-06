import { Configuration } from '@hpi-schul-cloud/commons';
import { AuthConfigFactory } from '../mapper';

const jwtOptions = {
	audience: Configuration.get('JWT_AUD') as string,
	issuer: 'feathers', // should be in our case need to be changed in part 3 of this ticket Configuration.get('JWT_AUD') as string,
	expiresIn: Configuration.get('JWT_LIFETIME') as string,
};

export const authConfig = AuthConfigFactory.build(Configuration.get('AUTHENTICATION'), jwtOptions);
