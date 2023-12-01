import { ToolConfigurationStatusResponse } from '../../context-external-tool/controller/dto';
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
