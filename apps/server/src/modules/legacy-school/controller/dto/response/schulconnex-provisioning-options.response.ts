import { ApiProperty } from '@nestjs/swagger';
import { SchulConneXProvisioningOptions } from '../../../interface';

export class SchulConneXProvisioningOptionsResponse implements SchulConneXProvisioningOptions {
	@ApiProperty()
	groupProvisioningClassesEnabled: boolean;

	@ApiProperty()
	groupProvisioningCoursesEnabled: boolean;

	@ApiProperty()
	groupProvisioningOtherEnabled: boolean;

	constructor(props: SchulConneXProvisioningOptionsResponse) {
		this.groupProvisioningClassesEnabled = props.groupProvisioningClassesEnabled;
		this.groupProvisioningCoursesEnabled = props.groupProvisioningCoursesEnabled;
		this.groupProvisioningOtherEnabled = props.groupProvisioningOtherEnabled;
	}
}
