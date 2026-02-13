import { ConfigurationParameters } from './etherpad-api-client';

export interface InternalEtherpadClientConfig extends ConfigurationParameters {
	apiKey: string;
	basePath: string;
}
