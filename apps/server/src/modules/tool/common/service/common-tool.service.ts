import { Injectable } from '@nestjs/common';
import { ContextExternalTool } from '../../context-external-tool/domain/context-external-tool.do';
import { ExternalTool } from '../../external-tool/domain/external-tool.do';
import { SchoolExternalTool } from '../../school-external-tool/domain/school-external-tool.do';
import { ToolConfigurationStatus } from '../enum/tool-configuration-status';
import { ToolVersion } from '../interface/tool-version.interface';

@Injectable()
export class CommonToolService {
	determineToolConfigurationStatus(
		externalTool: ExternalTool,
		schoolExternalTool: SchoolExternalTool,
		contextExternalTool: ContextExternalTool
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
