import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { SchoolExternalToolRepo } from '@shared/repo';
import { ToolConfigurationStatus } from '../../common/domain';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { IToolFeatures, ToolFeatures } from '../../tool-config';
import { SchoolExternalTool } from '../domain';
import { SchoolExternalToolQuery } from '../uc/dto/school-external-tool.types';
import { SchoolExternalToolValidationService } from './school-external-tool-validation.service';

@Injectable()
export class SchoolExternalToolService {
	constructor(
		private readonly schoolExternalToolRepo: SchoolExternalToolRepo,
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolValidationService: SchoolExternalToolValidationService,
		@Inject(ToolFeatures) private readonly toolFeatures: IToolFeatures
	) {}

	async findById(schoolExternalToolId: EntityId): Promise<SchoolExternalTool> {
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
		const externalTool: ExternalTool = await this.externalToolService.findById(tool.toolId);
		const status: ToolConfigurationStatus = await this.determineStatus(tool, externalTool);
		const schoolExternalTool: SchoolExternalTool = new SchoolExternalTool({
			...tool,
			status,
			name: externalTool.name,
		});

		return schoolExternalTool;
	}

	private async determineStatus(
		tool: SchoolExternalTool,
		externalTool: ExternalTool
	): Promise<ToolConfigurationStatus> {
		const toolConfigStatus: ToolConfigurationStatus = new ToolConfigurationStatus({
			isDisabled: false,
			isOutdatedOnScopeContext: false,
			isOutdatedOnScopeSchool: true,
		});

		if (this.toolFeatures.toolStatusWithoutVersions) {
			try {
				await this.schoolExternalToolValidationService.validate(tool);

				return ToolConfigurationStatus.prototype;
			} catch (err) {
				return toolConfigStatus;
			}
		}

		if (externalTool.version <= tool.toolVersion) {
			toolConfigStatus.isOutdatedOnScopeSchool = false;
			toolConfigStatus.isOutdatedOnScopeContext = false;
			return toolConfigStatus;
		}

		return toolConfigStatus;
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
