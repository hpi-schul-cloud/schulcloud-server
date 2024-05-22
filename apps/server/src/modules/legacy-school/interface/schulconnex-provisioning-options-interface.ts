import { ProvisioningOptionsInterface } from './provisioning-options-interface';

export type SchulConneXProvisioningOptionsInterface = Required<
	Pick<
		ProvisioningOptionsInterface,
		| 'groupProvisioningClassesEnabled'
		| 'groupProvisioningCoursesEnabled'
		| 'groupProvisioningOtherEnabled'
		| 'ctlToolProvisioningEnabled'
	>
>;
