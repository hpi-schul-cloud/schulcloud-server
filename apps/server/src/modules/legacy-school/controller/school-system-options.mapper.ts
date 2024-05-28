import { AnyProvisioningOptions } from '../domain';
import { AnyProvisioningOptionsResponse, SchulConneXProvisioningOptionsResponse } from './dto';

export class SchoolSystemOptionsMapper {
	static mapProvisioningOptionsToResponse(options: AnyProvisioningOptions): AnyProvisioningOptionsResponse {
		const mapped: SchulConneXProvisioningOptionsResponse = new SchulConneXProvisioningOptionsResponse({
			groupProvisioningClassesEnabled: options.groupProvisioningClassesEnabled,
			groupProvisioningCoursesEnabled: options.groupProvisioningCoursesEnabled,
			groupProvisioningOtherEnabled: options.groupProvisioningOtherEnabled,
			schoolExternalToolProvisioningEnabled: options.schoolExternalToolProvisioningEnabled,
		});

		return mapped;
	}
}
