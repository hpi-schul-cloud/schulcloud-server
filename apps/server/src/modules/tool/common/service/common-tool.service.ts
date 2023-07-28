import { Injectable } from '@nestjs/common';
import { ExternalToolDO } from '../../external-tool/domain';
import { SchoolExternalToolDO } from '../../school-external-tool/domain';
import { ContextExternalToolDO } from '../../context-external-tool/domain';
import { ToolConfigurationStatus } from '../enum/tool-configuration-status';
import { ToolVersion } from '../interface';

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
