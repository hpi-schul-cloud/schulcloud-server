import { type ConfigurationParameters } from './generated';

export interface InternalEtherpadClientConfig extends ConfigurationParameters {
	apiKey: string;
	basePath: string;
}
