import { Injectable } from '@nestjs/common';
import { SchoolExternalToolRepo } from '@shared/repo';
import { EntityId } from '@shared/domain';
import { SchoolExternalToolQuery } from '../uc/dto/school-external-tool.types';
import { ExternalToolService } from '../../external-tool/service';
import { SchoolExternalTool } from '../domain';
import { ExternalToolDO } from '../../external-tool/domain';
import { ToolConfigurationStatus } from '../../common/enum';

@Injectable()
export class SchoolExternalToolService {
	constructor(
		private readonly schoolExternalToolRepo: SchoolExternalToolRepo,
		private readonly externalToolService: ExternalToolService
	) {}

	async getSchoolExternalToolById(schoolExternalToolId: EntityId): Promise<SchoolExternalTool> {
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolRepo.findById(schoolExternalToolId);
		return schoolExternalTool;
	}

	async findSchoolExternalTools(query: SchoolExternalToolQuery): Promise<SchoolExternalTool[]> {
		let schoolExternalTools: SchoolExternalTool[] = await this.schoolExternalToolRepo.find({
			schoolId: query.schoolId,
		});

		schoolExternalTools = await this.enrichWithDataFromExternalTools(schoolExternalTools);

		return schoolExternalTools;
	}

	private async enrichWithDataFromExternalTools(tools: SchoolExternalTool[]): Promise<SchoolExternalTool[]> {
		const enrichedTools: SchoolExternalTool[] = await Promise.all(
			tools.map(async (tool: SchoolExternalTool): Promise<SchoolExternalTool> => this.enrichDataFromExternalTool(tool))
		);

		return enrichedTools;
	}

	private async enrichDataFromExternalTool(tool: SchoolExternalTool): Promise<SchoolExternalTool> {
		const externalToolDO: ExternalToolDO = await this.externalToolService.findExternalToolById(tool.toolId);
		const status: ToolConfigurationStatus = this.determineStatus(tool, externalToolDO);
		const schoolExternalTool: SchoolExternalTool = new SchoolExternalTool({
			...tool,
			status,
			name: externalToolDO.name,
		});

		return schoolExternalTool;
	}

	private determineStatus(tool: SchoolExternalTool, externalToolDO: ExternalToolDO): ToolConfigurationStatus {
		if (externalToolDO.version <= tool.toolVersion) {
			return ToolConfigurationStatus.LATEST;
		}

		return ToolConfigurationStatus.OUTDATED;
	}

	async deleteSchoolExternalToolById(schoolExternalToolId: EntityId): Promise<void> {
		await this.schoolExternalToolRepo.deleteById(schoolExternalToolId);
	}

	async saveSchoolExternalTool(schoolExternalTool: SchoolExternalTool): Promise<SchoolExternalTool> {
		let createdSchoolExternalTool: SchoolExternalTool = await this.schoolExternalToolRepo.save(schoolExternalTool);
		createdSchoolExternalTool = await this.enrichDataFromExternalTool(createdSchoolExternalTool);
		return createdSchoolExternalTool;
	}
}
