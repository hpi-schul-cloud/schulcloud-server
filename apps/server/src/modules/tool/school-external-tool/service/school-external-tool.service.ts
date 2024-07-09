import { Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common';
import { EntityId } from '@shared/domain/types';
import { SchoolExternalToolRepo } from '@shared/repo';
import { CommonToolValidationService } from '../../common/service';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { SchoolExternalTool, SchoolExternalToolConfigurationStatus } from '../domain';
import { SchoolExternalToolQuery } from '../uc/dto/school-external-tool.types';

@Injectable()
export class SchoolExternalToolService {
	constructor(
		private readonly schoolExternalToolRepo: SchoolExternalToolRepo,
		private readonly externalToolService: ExternalToolService,
		private readonly commonToolValidationService: CommonToolValidationService
	) {}

	public async findById(schoolExternalToolId: EntityId): Promise<SchoolExternalTool> {
		let schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolRepo.findById(schoolExternalToolId);

		schoolExternalTool = await this.enrichWithDataFromExternalTool(schoolExternalTool);

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
			tools.map(
				async (tool: SchoolExternalTool): Promise<SchoolExternalTool> => this.enrichWithDataFromExternalTool(tool)
			)
		);

		return enrichedTools;
	}

	private async enrichWithDataFromExternalTool(tool: SchoolExternalTool): Promise<SchoolExternalTool> {
		const externalTool: ExternalTool = await this.externalToolService.findById(tool.toolId);
		const status: SchoolExternalToolConfigurationStatus = this.determineSchoolToolStatus(tool, externalTool);

		const schoolExternalTool: SchoolExternalTool = new SchoolExternalTool({
			...tool.getProps(),
			name: externalTool.name,
			status,
		});

		return schoolExternalTool;
	}

	private determineSchoolToolStatus(
		tool: SchoolExternalTool,
		externalTool: ExternalTool
	): SchoolExternalToolConfigurationStatus {
		let isOutdatedOnScopeSchool = false;

		const errors: ValidationError[] = this.commonToolValidationService.validateParameters(externalTool, tool);

		if (errors.length) {
			isOutdatedOnScopeSchool = true;
		}

		const status: SchoolExternalToolConfigurationStatus = new SchoolExternalToolConfigurationStatus({
			isOutdatedOnScopeSchool,
			isGloballyDeactivated: externalTool.isDeactivated,
		});

		return status;
	}

	public deleteSchoolExternalToolById(schoolExternalToolId: EntityId): void {
		this.schoolExternalToolRepo.deleteById(schoolExternalToolId);
	}

	public async saveSchoolExternalTool(schoolExternalTool: SchoolExternalTool): Promise<SchoolExternalTool> {
		let createdSchoolExternalTool: SchoolExternalTool = await this.schoolExternalToolRepo.save(schoolExternalTool);

		createdSchoolExternalTool = await this.enrichWithDataFromExternalTool(createdSchoolExternalTool);

		return createdSchoolExternalTool;
	}
}
