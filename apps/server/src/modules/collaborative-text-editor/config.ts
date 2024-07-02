import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { EtherpadClientConfig } from '@src/infra/etherpad-client';

export const etherpadClientConfig: EtherpadClientConfig = {
	apiKey: Configuration.has('ETHERPAD__API_KEY') ? (Configuration.get('ETHERPAD__API_KEY') as string) : undefined,
	basePath: Configuration.has('ETHERPAD__URI') ? (Configuration.get('ETHERPAD__URI') as string) : undefined,
};
