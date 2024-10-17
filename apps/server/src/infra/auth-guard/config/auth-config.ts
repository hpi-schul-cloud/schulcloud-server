import { Configuration } from '@hpi-schul-cloud/commons';
import { AuthConfigFactory } from '../mapper';

const jwtOptions = {
	audience: Configuration.get('JWT_AUD') as string,
	issuer: 'feathers', // should be in our case need to be changed in part 3 of this ticket Configuration.get('JWT_AUD') as string,
	expiresIn: Configuration.get('JWT_LIFETIME') as string,
};

const privateKey = Configuration.get('JWT_PRIVATE_KEY') as string;
const publicKey = Configuration.get('JWT_PUBLIC_KEY') as string;

// Node's process.env escapes newlines. We need to reverse it for the keys to work.
// See: https://stackoverflow.com/questions/30400341/environment-variables-containing-newlines-in-node
const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
const formattedPublicKey = publicKey.replace(/\\n/g, '\n');

export const authConfig = AuthConfigFactory.build(formattedPrivateKey, formattedPublicKey, jwtOptions);
