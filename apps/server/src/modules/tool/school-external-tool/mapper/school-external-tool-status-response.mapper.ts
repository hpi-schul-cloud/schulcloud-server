import { SchoolToolConfigurationStatus } from '../controller/dto';
import { SchoolToolConfigurationStatusResponse } from '../controller/dto/school-external-tool-configuration.response';

export class SchoolToolConfigurationStatusResponseMapper {
	static mapToResponse(status: SchoolToolConfigurationStatus): SchoolToolConfigurationStatusResponse {
		const configurationStatus: SchoolToolConfigurationStatusResponse = new SchoolToolConfigurationStatusResponse({
			isOutdatedOnScopeSchool: status.isOutdatedOnScopeSchool,
		});

		return configurationStatus;
	}
}
