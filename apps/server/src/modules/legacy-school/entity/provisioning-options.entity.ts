import { Embeddable, Property } from '@mikro-orm/core';
import { ProvisioningOptionsInterface } from '../interface';

@Embeddable()
export class ProvisioningOptionsEntity implements ProvisioningOptionsInterface {
	@Property({ nullable: true, type: 'boolean' })
	groupProvisioningClassesEnabled?: boolean;

	@Property({ nullable: true, type: 'boolean' })
	groupProvisioningCoursesEnabled?: boolean;

	@Property({ nullable: true, type: 'boolean' })
	groupProvisioningOtherEnabled?: boolean;

	@Property({ nullable: true, type: 'boolean' })
	schoolExternalToolProvisioningEnabled?: boolean;

	constructor(props: ProvisioningOptionsInterface) {
		this.groupProvisioningClassesEnabled = props.groupProvisioningClassesEnabled;
		this.groupProvisioningCoursesEnabled = props.groupProvisioningCoursesEnabled;
		this.groupProvisioningOtherEnabled = props.groupProvisioningOtherEnabled;
		this.schoolExternalToolProvisioningEnabled = props.schoolExternalToolProvisioningEnabled;
	}
}
