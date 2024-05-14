import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { SchoolExternalToolRepo } from '@shared/repo';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { SchoolExternalToolConfigurationStatus } from '../controller/dto';
import { SchoolExternalTool } from '../domain';
import { SchoolExternalToolQuery } from '../uc/dto/school-external-tool.types';
import { SchoolExternalToolValidationService } from './school-external-tool-validation.service';

@Injectable()
export class SchoolExternalToolService {
	constructor(
		private readonly schoolExternalToolRepo: SchoolExternalToolRepo,
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolValidationService: SchoolExternalToolValidationService
	) {}

	public async findById(schoolExternalToolId: EntityId): Promise<SchoolExternalTool> {
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolRepo.findById(schoolExternalToolId);

		return schoolExternalTool;
	}

	public async findSchoolExternalTools(query: SchoolExternalToolQuery): Promise<SchoolExternalTool[]> {
		let schoolExternalTools: SchoolExternalTool[] = await this.schoolExternalToolRepo.find({
			schoolId: query.schoolId,
			toolId: query.toolId,
			isDeactivated: query.isDeactivated,
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
		const externalTool: ExternalTool = await this.externalToolService.findById(tool.toolId);
		const status: SchoolExternalToolConfigurationStatus = await this.determineSchoolToolStatus(tool, externalTool);
		const schoolExternalTool: SchoolExternalTool = new SchoolExternalTool({
			id: tool.id,
			toolId: tool.toolId,
			schoolId: tool.schoolId,
			parameters: tool.parameters,
			status,
			name: externalTool.name,
		});

		return schoolExternalTool;
	}

	private async determineSchoolToolStatus(
		tool: SchoolExternalTool,
		externalTool: ExternalTool
	): Promise<SchoolExternalToolConfigurationStatus> {
		const status: SchoolExternalToolConfigurationStatus = new SchoolExternalToolConfigurationStatus({
			isOutdatedOnScopeSchool: true,
			isDeactivated: this.isToolDeactivated(externalTool, tool),
		});

		try {
			await this.schoolExternalToolValidationService.validate(tool);

			status.isOutdatedOnScopeSchool = false;

			return status;
		} catch (err) {
			return status;
		}
	}

	public deleteSchoolExternalToolById(schoolExternalToolId: EntityId): void {
		this.schoolExternalToolRepo.deleteById(schoolExternalToolId);
	}

	public async saveSchoolExternalTool(schoolExternalTool: SchoolExternalTool): Promise<SchoolExternalTool> {
		let createdSchoolExternalTool: SchoolExternalTool = await this.schoolExternalToolRepo.createOrUpdate(
			schoolExternalTool
		);
		createdSchoolExternalTool = await this.enrichDataFromExternalTool(createdSchoolExternalTool);

		return createdSchoolExternalTool;
	}

	private isToolDeactivated(externalTool: ExternalTool, schoolExternalTool: SchoolExternalTool) {
		if (externalTool.isDeactivated || schoolExternalTool.status?.isDeactivated) {
			return true;
		}

		return false;
	}
}
