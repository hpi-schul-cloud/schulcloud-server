import { Configuration } from '@hpi-schul-cloud/commons/lib';

export const ProvisioningFeatures = Symbol('ProvisioningFeatures');

export interface IProvisioningFeatures {
	schulconnexGroupProvisioningEnabled: boolean;
	schulconnexCourseSyncEnabled: boolean;
	schulconnexOtherGroupusersEnabled: boolean;
}

export class ProvisioningConfiguration {
	static provisioningFeatures: IProvisioningFeatures = {
		schulconnexGroupProvisioningEnabled: Configuration.get('FEATURE_SANIS_GROUP_PROVISIONING_ENABLED') as boolean,
		schulconnexCourseSyncEnabled: Configuration.get('FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED') as boolean,
		schulconnexOtherGroupusersEnabled: Configuration.get('FEATURE_OTHER_GROUPUSERS_PROVISIONING_ENABLED') as boolean,
	};
}
