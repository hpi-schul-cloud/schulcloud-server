import { SchulConneXProvisioningOptionsInterface } from '../interface';
import { BaseProvisioningOptions } from './base-provisioning-options';
import { ProvisioningOptionsType } from './provisioning-options-type';

export class SchulConneXProvisioningOptions
	extends BaseProvisioningOptions<SchulConneXProvisioningOptionsInterface>
	implements SchulConneXProvisioningOptionsInterface
{
	groupProvisioningClassesEnabled = true;

	groupProvisioningCoursesEnabled = false;

	groupProvisioningOtherEnabled = false;

	schoolExternalToolProvisioningEnabled = false;

	get getType(): ProvisioningOptionsType {
		return ProvisioningOptionsType.SCHULCONNEX;
	}

	set(props: SchulConneXProvisioningOptionsInterface): this {
		this.groupProvisioningClassesEnabled = props.groupProvisioningClassesEnabled;
		this.groupProvisioningCoursesEnabled = props.groupProvisioningCoursesEnabled;
		this.groupProvisioningOtherEnabled = props.groupProvisioningOtherEnabled;
		this.schoolExternalToolProvisioningEnabled = props.schoolExternalToolProvisioningEnabled;

		return this;
	}
}
