import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { EtherpadClientConfig } from '@src/infra/etherpad-client';

export const etherpadClientConfig: EtherpadClientConfig = {
	apiKey: Configuration.has('ETHERPAD_API_KEY') ? (Configuration.get('ETHERPAD_API_KEY') as string) : undefined,
	basePath: Configuration.has('ETHERPAD_URI') ? (Configuration.get('ETHERPAD_URI') as string) : undefined,
	cookieExpiresSeconds: Configuration.has('ETHERPAD_COOKIE__EXPIRES_SECONDS')
		? (Configuration.get('ETHERPAD_COOKIE__EXPIRES_SECONDS') as number)
		: 1000,
	cookieReleaseThreshold: Configuration.has('ETHERPAD_COOKIE_RELEASE_THRESHOLD')
		? (Configuration.get('ETHERPAD_COOKIE_RELEASE_THRESHOLD') as number)
		: 1000,
	padURI: Configuration.has('ETHERPAD__PAD_URI') ? (Configuration.get('ETHERPAD__PAD_URI') as string) : '',
};
