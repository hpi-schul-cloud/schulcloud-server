import { Injectable } from '@nestjs/common';
import { ExternalTool } from '../../external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ToolConfigurationStatus, ToolContextType } from '../enum';
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

	public isContextRestricted(externalTool: ExternalTool, context: ToolContextType): boolean {
		if (externalTool.restrictToContexts?.length && !externalTool.restrictToContexts.includes(context)) {
			return true;
		}
		return false;
	}
}
