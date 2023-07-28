import { Injectable } from '@nestjs/common';
import { ExternalToolDO } from '../../external-tool/domain';
import { SchoolExternalToolDO } from '../../school-external-tool/domain';
import { ContextExternalToolDO } from '../../context-external-tool/domain';
import { ToolConfigurationStatus } from '../enum';
import { ToolVersion } from '../interface';

@Injectable()
export class CommonToolService {
	determineToolConfigurationStatus(
		externalToolDO: ExternalToolDO,
		schoolExternalToolDO: SchoolExternalToolDO,
		contextExternalTool: ContextExternalToolDO
	): ToolConfigurationStatus {
		if (
			this.isLatest(schoolExternalToolDO, externalToolDO) &&
			this.isLatest(contextExternalTool, schoolExternalToolDO) &&
			this.isLatest(contextExternalTool, externalToolDO)
		) {
			return ToolConfigurationStatus.LATEST;
		}

		return ToolConfigurationStatus.OUTDATED;
	}

	private isLatest(tool1: ToolVersion, tool2: ToolVersion): boolean {
		return tool1.getVersion() >= tool2.getVersion();
	}
}
