import { Injectable } from '@nestjs/common';
import { ToolConfigurationStatus, ToolVersion } from '@shared/domain';

@Injectable()
export class CommonToolService {
	determineToolConfigurationStatus(
		tool1: ToolVersion,
		tool2: ToolVersion,
		tool3: ToolVersion
	): ToolConfigurationStatus {
		if (this.compareVersions(tool1, tool2) && this.compareVersions(tool2, tool3)) {
			return ToolConfigurationStatus.LATEST;
		}

		return ToolConfigurationStatus.OUTDATED;
	}

	compareVersions(tool1: ToolVersion, tool2: ToolVersion): boolean {
		return tool1.getVersion() === tool2.getVersion();
	}
}
