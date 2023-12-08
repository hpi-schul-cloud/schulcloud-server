import { AnyProvisioningOptions, SchulConneXProvisioningOptions } from '../domain';
import { AnyProvisioningOptionsResponse, SchulConneXProvisioningOptionsResponse } from './dto';

export class SchoolSystemOptionsMapper {
	static mapProvisioningOptionsToResponse(options: AnyProvisioningOptions): AnyProvisioningOptionsResponse {
		if (options instanceof SchulConneXProvisioningOptions) {
			return new SchulConneXProvisioningOptionsResponse({
				groupProvisioningClassesEnabled: options.groupProvisioningClassesEnabled,
				groupProvisioningCoursesEnabled: options.groupProvisioningCoursesEnabled,
				groupProvisioningOtherEnabled: options.groupProvisioningOtherEnabled,
			});
		}

		// TODO
		throw new Error();
	}
}
