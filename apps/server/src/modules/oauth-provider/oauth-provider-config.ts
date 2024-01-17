import { Configuration } from '@hpi-schul-cloud/commons/lib';

export const OauthProviderFeatures = Symbol('OauthProviderFeatures');

export interface IOauthProviderFeatures {
	hydraUri: string;
}

export default class OauthProviderConfiguration {
	static features: IOauthProviderFeatures = {
		hydraUri: Configuration.get('HYDRA_URI') as string,
	};
}
