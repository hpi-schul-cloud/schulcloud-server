import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { EtherpadClientConfig } from '@src/infra/etherpad-client';

export const etherpadClientConfig: EtherpadClientConfig = {
	apiKey: Configuration.has('ETHERPAD_API_KEY') ? (Configuration.get('ETHERPAD_API_KEY') as string) : undefined,
	basePath: Configuration.has('ETHERPAD_URI') ? (Configuration.get('ETHERPAD_URI') as string) : undefined,
};
