import { IsBoolean, IsOptional } from 'class-validator';
import { ProvisioningOptionsInterface } from '../../../interface';

export class ProvisioningOptionsParams implements ProvisioningOptionsInterface {
	@IsOptional()
	@IsBoolean()
	groupProvisioningClassesEnabled?: boolean;

	@IsOptional()
	@IsBoolean()
	groupProvisioningCoursesEnabled?: boolean;

	@IsOptional()
	@IsBoolean()
	groupProvisioningOtherEnabled?: boolean;

	@IsOptional()
	@IsBoolean()
	schoolExternalToolProvisioningEnabled?: boolean;
}
