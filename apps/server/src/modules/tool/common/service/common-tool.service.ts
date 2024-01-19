import { Injectable } from '@nestjs/common';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ExternalTool } from '../../external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ContextExternalToolConfigurationStatus } from '../domain';
import { ToolContextType } from '../enum';
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
			isIncompleteOnScopeContext: false,
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
