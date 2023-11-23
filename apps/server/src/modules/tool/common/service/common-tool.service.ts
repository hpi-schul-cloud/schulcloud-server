import { Injectable } from '@nestjs/common';
import { ExternalTool } from '../../external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ToolConfigurationStatus } from '../enum';
import { ToolVersion } from '../interface';

// TODO N21-1337 remove class when tool versioning is removed
@Injectable()
export class CommonToolService {
	/**
	 * @deprecated use ToolVersionService
	 */
	determineToolConfigurationStatus(
		externalTool: ExternalTool,
		schoolExternalTool: SchoolExternalTool,
		contextExternalTool: ContextExternalTool
	): ToolConfigurationStatus {
		const configurationStatus: ToolConfigurationStatus = new ToolConfigurationStatus({
			latest: false,
			isDisabled: false,
			isOutdatedOnScopeContext: true,
			isOutdatedOnScopeSchool: true,
			isUnkown: false,
		});

		if (
			this.isLatest(schoolExternalTool, externalTool) &&
			this.isLatest(contextExternalTool, schoolExternalTool) &&
			this.isLatest(contextExternalTool, externalTool)
		) {
			configurationStatus.latest = true;
			configurationStatus.isOutdatedOnScopeContext = false;
			configurationStatus.isOutdatedOnScopeSchool = false;
		}

		return configurationStatus;
	}

	private isLatest(tool1: ToolVersion, tool2: ToolVersion): boolean {
		return tool1.getVersion() >= tool2.getVersion();
	}
}
