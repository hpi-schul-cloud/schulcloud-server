import { ContextExternalToolConfigurationStatusResponse } from '../controller/dto';
import { ContextExternalToolConfigurationStatus } from '../domain';

export class ToolStatusResponseMapper {
	static mapToResponse(status: ContextExternalToolConfigurationStatus): ContextExternalToolConfigurationStatusResponse {
		const configurationStatus: ContextExternalToolConfigurationStatusResponse =
			new ContextExternalToolConfigurationStatusResponse({
				isOutdatedOnScopeSchool: status.isOutdatedOnScopeSchool,
				isOutdatedOnScopeContext: status.isOutdatedOnScopeContext,
				isDeactivated: status.isDeactivated,
			});

		return configurationStatus;
	}
}
