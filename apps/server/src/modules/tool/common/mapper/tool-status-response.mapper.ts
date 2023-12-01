import { ToolConfigurationStatusResponse } from '../controller/dto/tool-configuration-status.response';
import { ToolConfigurationStatus } from '../domain';

export class ToolStatusResponseMapper {
	static mapToResponse(status: ToolConfigurationStatus): ToolConfigurationStatusResponse {
		const configurationStatus: ToolConfigurationStatusResponse = new ToolConfigurationStatusResponse({
			isOutdatedOnScopeSchool: status.isOutdatedOnScopeSchool,
			isOutdatedOnScopeContext: status.isOutdatedOnScopeContext,
		});

		return configurationStatus;
	}
}
