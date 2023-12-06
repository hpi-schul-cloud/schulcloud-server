import { ProvisioningOptionsInterface } from './provisioning-options-interface';
import { ProvisioningOptions } from './provisioning-options.enum';

export type SchulConneXProvisioningOptionsInterface = Required<
	Pick<
		ProvisioningOptionsInterface,
		| ProvisioningOptions.GROUP_PROVISIONING_COURSES_ENABLED
		| ProvisioningOptions.GROUP_PROVISIONING_CLASSES_ENABLED
		| ProvisioningOptions.GROUP_PROVISIONING_OTHER_ENABLED
	>
>;
