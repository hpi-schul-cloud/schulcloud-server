import { ApiProperty } from '@nestjs/swagger';
import { SchulConneXProvisioningOptionsInterface } from '../../../interface';

export class SchulConneXProvisioningOptionsParams implements SchulConneXProvisioningOptionsInterface {
	@ApiProperty()
	groupProvisioningClassesEnabled!: boolean;

	@ApiProperty()
	groupProvisioningCoursesEnabled!: boolean;

	@ApiProperty()
	groupProvisioningOtherEnabled!: boolean;

	@ApiProperty()
	schoolExternalToolProvisioningEnabled!: boolean;
}
