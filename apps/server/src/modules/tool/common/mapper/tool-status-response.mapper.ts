import { ContextExternalToolConfigurationStatusResponse } from '../controller/dto';
import { ContextExternalToolConfigurationStatus } from '../domain';

export class ToolStatusResponseMapper {
	static mapToResponse(status: ContextExternalToolConfigurationStatus): ContextExternalToolConfigurationStatusResponse {
		const configurationStatus: ContextExternalToolConfigurationStatusResponse =
			new ContextExternalToolConfigurationStatusResponse({
				isOutdatedOnScopeSchool: status.isOutdatedOnScopeSchool,
				isOutdatedOnScopeContext: status.isOutdatedOnScopeContext,
				isIncompleteOnScopeContext: status.isIncompleteOnScopeContext,
				isIncompleteOperationalOnScopeContext: status.isIncompleteOperationalOnScopeContext,
				isDeactivated: status.isDeactivated,
				isNotLicensed: status.isNotLicensed,
			});

		return configurationStatus;
	}
}
