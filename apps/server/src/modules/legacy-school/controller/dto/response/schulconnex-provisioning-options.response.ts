import { ApiProperty } from '@nestjs/swagger';
import { SchulConneXProvisioningOptionsInterface } from '../../../interface';

export class SchulConneXProvisioningOptionsResponse implements SchulConneXProvisioningOptionsInterface {
	@ApiProperty()
	groupProvisioningClassesEnabled: boolean;

	@ApiProperty()
	groupProvisioningCoursesEnabled: boolean;

	@ApiProperty()
	groupProvisioningOtherEnabled: boolean;

	@ApiProperty()
	ctlToolProvisioningEnabled: boolean;

	constructor(props: SchulConneXProvisioningOptionsResponse) {
		this.groupProvisioningClassesEnabled = props.groupProvisioningClassesEnabled;
		this.groupProvisioningCoursesEnabled = props.groupProvisioningCoursesEnabled;
		this.groupProvisioningOtherEnabled = props.groupProvisioningOtherEnabled;
		this.ctlToolProvisioningEnabled = props.ctlToolProvisioningEnabled;
	}
}
