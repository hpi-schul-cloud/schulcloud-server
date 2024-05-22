import { Embeddable, Property } from '@mikro-orm/core';
import { ProvisioningOptionsInterface } from '../interface';

@Embeddable()
export class ProvisioningOptionsEntity implements ProvisioningOptionsInterface {
	@Property({ nullable: true })
	groupProvisioningClassesEnabled?: boolean;

	@Property({ nullable: true })
	groupProvisioningCoursesEnabled?: boolean;

	@Property({ nullable: true })
	groupProvisioningOtherEnabled?: boolean;

	@Property({ nullable: true })
	ctlToolProvisioningEnabled?: boolean;

	constructor(props: ProvisioningOptionsInterface) {
		this.groupProvisioningClassesEnabled = props.groupProvisioningClassesEnabled;
		this.groupProvisioningCoursesEnabled = props.groupProvisioningCoursesEnabled;
		this.groupProvisioningOtherEnabled = props.groupProvisioningOtherEnabled;
		this.ctlToolProvisioningEnabled = props.ctlToolProvisioningEnabled;
	}
}
