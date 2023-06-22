import { Injectable } from '@nestjs/common';
import { SchoolExternalToolRepo } from '@shared/repo';
import { SchoolExternalToolDO, ExternalToolDO, ToolConfigurationStatus, EntityId } from '@shared/domain';
import { ExternalToolService } from './external-tool.service';
import { SchoolExternalToolQuery } from '../uc/dto';

@Injectable()
export class SchoolExternalToolService {
	constructor(
		private readonly schoolExternalToolRepo: SchoolExternalToolRepo,
		private readonly externalToolService: ExternalToolService
	) {}

	async getSchoolExternalToolById(schoolExternalToolId: EntityId): Promise<SchoolExternalToolDO> {
		const schoolExternalTool: SchoolExternalToolDO = await this.schoolExternalToolRepo.findById(schoolExternalToolId);
		const enrichedTools: SchoolExternalToolDO[] = await this.enrichWithDataFromExternalTools([schoolExternalTool]);

		return enrichedTools[0];
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
		const status: ToolConfigurationStatus = this.determineStatus(tool, externalToolDO);
		const schoolExternalTool: SchoolExternalToolDO = new SchoolExternalToolDO({
			...tool,
			status,
			name: externalToolDO.name,
		});

		return schoolExternalTool;
	}

	private determineStatus(tool: SchoolExternalToolDO, externalToolDO: ExternalToolDO): ToolConfigurationStatus {
		if (externalToolDO.version <= tool.toolVersion) {
			return ToolConfigurationStatus.LATEST;
		}

		return ToolConfigurationStatus.OUTDATED;
	}

	async deleteSchoolExternalToolById(schoolExternalToolId: EntityId): Promise<void> {
		await this.schoolExternalToolRepo.deleteById(schoolExternalToolId);
	}

	async saveSchoolExternalTool(schoolExternalTool: SchoolExternalToolDO): Promise<SchoolExternalToolDO> {
		let createdSchoolExternalTool: SchoolExternalToolDO = await this.schoolExternalToolRepo.save(schoolExternalTool);
		createdSchoolExternalTool = await this.enrichDataFromExternalTool(createdSchoolExternalTool);
		return createdSchoolExternalTool;
	}
}
