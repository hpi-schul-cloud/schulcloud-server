import { SchoolExternalToolConfigurationStatus } from '../controller/dto';
import { SchoolExternalToolConfigurationStatusResponse } from '../controller/dto/school-external-tool-configuration.response';

export class SchoolToolConfigurationStatusResponseMapper {
	static mapToResponse(status: SchoolExternalToolConfigurationStatus): SchoolExternalToolConfigurationStatusResponse {
		const configurationStatus: SchoolExternalToolConfigurationStatusResponse =
			new SchoolExternalToolConfigurationStatusResponse({
				isOutdatedOnScopeSchool: status.isOutdatedOnScopeSchool,
			});

		return configurationStatus;
	}
}
