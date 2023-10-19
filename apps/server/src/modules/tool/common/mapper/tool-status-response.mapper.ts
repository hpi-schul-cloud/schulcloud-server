import { ToolConfigurationStatusResponse } from '../../context-external-tool/controller/dto/tool-configuration-status.response';
import { ToolConfigurationStatus } from '../enum';

export const statusMapping: Record<ToolConfigurationStatus, ToolConfigurationStatusResponse> = {
	[ToolConfigurationStatus.LATEST]: ToolConfigurationStatusResponse.LATEST,
	[ToolConfigurationStatus.OUTDATED]: ToolConfigurationStatusResponse.OUTDATED,
	[ToolConfigurationStatus.UNKNOWN]: ToolConfigurationStatusResponse.UNKNOWN,
};

export class ToolStatusResponseMapper {
	static mapToResponse(status: ToolConfigurationStatus): ToolConfigurationStatusResponse {
		return statusMapping[status];
	}
}
