import { Injectable } from '@nestjs/common';
import { ExternalTool } from '../../external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ToolContextType } from '../enum';
import { ToolConfigurationStatus } from '../domain';
import { ToolVersion } from '../interface';

// TODO N21-1337 remove class when tool versioning is removed
@Injectable()
export class CommonToolService {
	/**
	 * @deprecated use ToolVersionService
	 */
	public determineToolConfigurationStatus(
		externalTool: ExternalTool,
		schoolExternalTool: SchoolExternalTool,
		contextExternalTool: ContextExternalTool
	): ToolConfigurationStatus {
		const configurationStatus: ToolConfigurationStatus = new ToolConfigurationStatus({
			isOutdatedOnScopeContext: true,
			isOutdatedOnScopeSchool: true,
		});

		if (!this.isLatest(schoolExternalTool, externalTool)) {
			configurationStatus.isOutdatedOnScopeContext = false;
			configurationStatus.isOutdatedOnScopeSchool = true;
		} else if (!this.isLatest(contextExternalTool, schoolExternalTool)) {
			configurationStatus.isOutdatedOnScopeContext = true;
			configurationStatus.isOutdatedOnScopeSchool = false;
		} else if (!this.isLatest(contextExternalTool, externalTool)) {
			configurationStatus.isOutdatedOnScopeContext = true;
			configurationStatus.isOutdatedOnScopeSchool = true;
		} else {
			configurationStatus.isOutdatedOnScopeContext = false;
			configurationStatus.isOutdatedOnScopeSchool = false;
		}

		return configurationStatus;
	}

	private isLatest(tool1: ToolVersion, tool2: ToolVersion): boolean {
		return tool1.getVersion() >= tool2.getVersion();
	}

	public isContextRestricted(externalTool: ExternalTool, context: ToolContextType): boolean {
		if (externalTool.restrictToContexts?.length && !externalTool.restrictToContexts.includes(context)) {
			return true;
		}
		return false;
	}
}
