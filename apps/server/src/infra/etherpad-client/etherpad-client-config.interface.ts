import { ConfigurationParameters } from '@infra/vidis-client';

export interface EtherpadClientConfig extends ConfigurationParameters {
	apiKey?: string;
	basePath?: string;
}
