import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProvisioningOptionsType } from '../../../interface';

export class ProvisioningOptionsResponse implements ProvisioningOptionsType {
	@ApiPropertyOptional()
	groupProvisioningClassesEnabled?: boolean;

	groupProvisioningCoursesEnabled?: boolean;

	groupProvisioningOtherEnabled?: boolean;
}
