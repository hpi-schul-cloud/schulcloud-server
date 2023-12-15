import { Configuration } from '@hpi-schul-cloud/commons/lib';

export const ProvisioningFeatures = Symbol('ProvisioningFeatures');

export interface IProvisioningFeatures {
	schulconnexGroupProvisioningEnabled: boolean;
	provisioningOptionsEnabled: boolean;
}

export class ProvisioningConfiguration {
	static provisioningFeatures: IProvisioningFeatures = {
		schulconnexGroupProvisioningEnabled: Configuration.get('FEATURE_SANIS_GROUP_PROVISIONING_ENABLED') as boolean,
		provisioningOptionsEnabled: Configuration.get('FEATURE_PROVISIONING_OPTIONS_ENABLED') as boolean,
	};
}
