import { ToolConfigurationStatusResponse } from '../../context-external-tool/controller/dto';
import { ToolConfigurationStatus } from '../enum';

export class ToolStatusResponseMapper {
	static mapToResponse(status: ToolConfigurationStatus): ToolConfigurationStatusResponse {
		const configurationStatus: ToolConfigurationStatusResponse = new ToolConfigurationStatusResponse({
			latest: status.latest,
			isDisabled: status.isDisabled,
			isOutdatedOnScopeSchool: status.isOutdatedOnScopeSchool,
			isOutdatedOnScopeContext: status.isOutdatedOnScopeContext,
			isUnkown: status.isUnkown,
		});

		return configurationStatus;
	}
}
