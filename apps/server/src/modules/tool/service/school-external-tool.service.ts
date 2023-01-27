import { Injectable } from '@nestjs/common';
import { SchoolExternalToolRepo } from '@shared/repo/schoolexternaltool/school-external-tool.repo';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { SchoolExternalToolStatus } from '@shared/domain/domainobject/external-tool/school-external-tool-status';
import { EntityId } from '@shared/domain';
import { ExternalToolService } from './external-tool.service';
import { SchoolExternalToolQuery } from '../uc/dto/school-external-tool.types';

@Injectable()
export class SchoolExternalToolService {
	constructor(
		private readonly schoolExternalToolRepo: SchoolExternalToolRepo,
		private readonly externalToolService: ExternalToolService
	) {}

	async getSchoolExternalToolById(schoolExternalToolId: EntityId): Promise<SchoolExternalToolDO> {
		const schoolExternalTool = await this.schoolExternalToolRepo.findById(schoolExternalToolId);
		return schoolExternalTool;
	}

	async findSchoolExternalTools(query: SchoolExternalToolQuery): Promise<SchoolExternalToolDO[]> {
		let schoolExternalToolDOs: SchoolExternalToolDO[] = await this.schoolExternalToolRepo.find({
			schoolId: query.schoolId,
		});

		schoolExternalToolDOs = await this.enrichWithDataFromExternalTools(schoolExternalToolDOs);

		return schoolExternalToolDOs;
	}

	private async enrichWithDataFromExternalTools(tools: SchoolExternalToolDO[]): Promise<SchoolExternalToolDO[]> {
		const enrichedTools: SchoolExternalToolDO[] = await Promise.all(
			tools.map(
				async (tool: SchoolExternalToolDO): Promise<SchoolExternalToolDO> => this.enrichDataFromExternalTool(tool)
			)
		);
		return enrichedTools;
	}

	private async enrichDataFromExternalTool(tool: SchoolExternalToolDO): Promise<SchoolExternalToolDO> {
		const externalToolDO: ExternalToolDO = await this.externalToolService.findExternalToolById(tool.toolId);
		return { ...tool, status: this.determineStatus(tool, externalToolDO), name: externalToolDO.name };
	}

	private determineStatus(tool: SchoolExternalToolDO, externalToolDO: ExternalToolDO): SchoolExternalToolStatus {
		if (externalToolDO.version <= tool.toolVersion) {
			return SchoolExternalToolStatus.LATEST;
		}
		return SchoolExternalToolStatus.OUTDATED;
	}

	async deleteSchoolExternalToolById(schoolExternalToolId: EntityId): Promise<void> {
		await this.schoolExternalToolRepo.deleteById(schoolExternalToolId);
	}

	async createSchoolExternalTool(schoolExternalTool: SchoolExternalToolDO): Promise<SchoolExternalToolDO> {
		let createdSchoolExternalTool: SchoolExternalToolDO = await this.schoolExternalToolRepo.save(schoolExternalTool);
		createdSchoolExternalTool = await this.enrichDataFromExternalTool(createdSchoolExternalTool);
		return createdSchoolExternalTool;
	}
}
