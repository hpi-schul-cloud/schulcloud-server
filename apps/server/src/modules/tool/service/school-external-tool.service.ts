import { Injectable } from '@nestjs/common';
import { SchoolExternalToolRepo } from '@shared/repo/schoolexternaltool/school-external-tool.repo';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { SchoolExternalToolStatus } from '@shared/domain/domainobject/external-tool/school-external-tool-status';
import { ExternalToolService } from './external-tool.service';
import { SchoolExternalToolQuery } from '../uc/dto/school-external-tool.types';

@Injectable()
export class SchoolExternalToolService {
	constructor(
		private readonly schoolExternalToolRepo: SchoolExternalToolRepo,
		private readonly externalToolService: ExternalToolService
	) {}

	async findSchoolExternalTools(query: SchoolExternalToolQuery): Promise<SchoolExternalToolDO[]> {
		let schoolExternalToolDOs: SchoolExternalToolDO[] = await this.schoolExternalToolRepo.find({
			schoolId: query.schoolId,
		});

		schoolExternalToolDOs = await this.enrichWithDataFromExternalTool(schoolExternalToolDOs);

		return schoolExternalToolDOs;
	}

	private async enrichWithDataFromExternalTool(tools: SchoolExternalToolDO[]): Promise<SchoolExternalToolDO[]> {
		const enrichedTools: SchoolExternalToolDO[] = await Promise.all(
			tools.map(async (tool: SchoolExternalToolDO): Promise<SchoolExternalToolDO> => {
				const externalToolDO: ExternalToolDO = await this.externalToolService.findExternalToolById(tool.toolId);
				return { ...tool, status: this.determineStatus(tool, externalToolDO), name: externalToolDO.name };
			})
		);
		return enrichedTools;
	}

	private determineStatus(tool: SchoolExternalToolDO, externalToolDO: ExternalToolDO): SchoolExternalToolStatus {
		if (externalToolDO.version <= tool.toolVersion) {
			return SchoolExternalToolStatus.LATEST;
		}
		return SchoolExternalToolStatus.OUTDATED;
	}
}
