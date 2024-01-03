import { Injectable } from '@nestjs/common';
import { ExternalTool } from '../../external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ToolContextType } from '../enum';
import { ContextExternalToolConfigurationStatus } from '../domain';
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
	): ContextExternalToolConfigurationStatus {
		const configurationStatus: ContextExternalToolConfigurationStatus = new ContextExternalToolConfigurationStatus({
			isOutdatedOnScopeContext: true,
			isOutdatedOnScopeSchool: true,
			isDeactivated: false,
		});

		if (
			this.isLatest(schoolExternalTool, externalTool) &&
			this.isLatest(contextExternalTool, schoolExternalTool) &&
			this.isLatest(contextExternalTool, externalTool)
		) {
			configurationStatus.isOutdatedOnScopeContext = false;
			configurationStatus.isOutdatedOnScopeSchool = false;
		} else {
			configurationStatus.isOutdatedOnScopeContext = true;
			configurationStatus.isOutdatedOnScopeSchool = true;
		}
		// TODO consider location of code snippet, before or after outdated.. method is also depricated
		if (externalTool.isDeactivated || schoolExternalTool.status?.isDeactivated) {
			configurationStatus.isDeactivated = true;
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
