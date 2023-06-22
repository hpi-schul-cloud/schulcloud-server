import { Injectable } from '@nestjs/common';
import {
	ContextExternalToolDO,
	ExternalToolDO,
	SchoolExternalToolDO,
	ToolConfigurationStatus,
	ToolVersion,
} from '@shared/domain';

@Injectable()
export class CommonToolService {
	determineToolConfigurationStatus(
		externalTool: ExternalToolDO,
		schoolExternalTool: SchoolExternalToolDO,
		contextExternalTool: ContextExternalToolDO
	): ToolConfigurationStatus {
		if (
			this.isLatest(schoolExternalTool, externalTool) &&
			this.isLatest(contextExternalTool, schoolExternalTool) &&
			this.isLatest(contextExternalTool, externalTool)
		) {
			return ToolConfigurationStatus.LATEST;
		}

		return ToolConfigurationStatus.OUTDATED;
	}

	private isLatest(tool1: ToolVersion, tool2: ToolVersion): boolean {
		return tool1.getVersion() >= tool2.getVersion();
	}
}
