import { SchulConneXProvisioningOptionsInterface } from '../interface';
import { BaseProvisioningOptions } from './base-provisioning-options';

export class SchulConneXProvisioningOptions
	extends BaseProvisioningOptions<SchulConneXProvisioningOptionsInterface>
	implements SchulConneXProvisioningOptionsInterface
{
	groupProvisioningClassesEnabled = false;

	groupProvisioningCoursesEnabled = false;

	groupProvisioningOtherEnabled = false;

	set(props: SchulConneXProvisioningOptionsInterface): this {
		this.groupProvisioningClassesEnabled = props.groupProvisioningClassesEnabled;
		this.groupProvisioningCoursesEnabled = props.groupProvisioningCoursesEnabled;
		this.groupProvisioningOtherEnabled = props.groupProvisioningOtherEnabled;

		return this;
	}
}
