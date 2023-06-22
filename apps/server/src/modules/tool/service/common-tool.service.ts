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
			this.compareVersions(schoolExternalTool, externalTool) &&
			this.compareVersions(contextExternalTool, schoolExternalTool) &&
			this.compareVersions(contextExternalTool, externalTool)
		) {
			return ToolConfigurationStatus.LATEST;
		}

		return ToolConfigurationStatus.OUTDATED;
	}

	compareVersions(tool1: ToolVersion, tool2: ToolVersion): boolean {
		return tool1.getVersion() >= tool2.getVersion();
	}
}
