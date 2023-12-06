import { ApiProperty } from '@nestjs/swagger';
import { SchulConneXProvisioningOptions } from '../../../interface';

export class SchulConneXProvisioningOptionsParams implements SchulConneXProvisioningOptions {
	@ApiProperty()
	groupProvisioningClassesEnabled!: boolean;

	@ApiProperty()
	groupProvisioningCoursesEnabled!: boolean;

	@ApiProperty()
	groupProvisioningOtherEnabled!: boolean;
}
