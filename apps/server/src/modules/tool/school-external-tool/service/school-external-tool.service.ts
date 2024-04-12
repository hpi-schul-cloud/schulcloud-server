import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { SchoolExternalToolRepo } from '@shared/repo';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { IToolFeatures, ToolFeatures } from '../../tool-config';
import { SchoolExternalToolConfigurationStatus } from '../controller/dto';
import { SchoolExternalTool, SchoolExternalToolWithId } from '../domain';
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

	// TODO: N21-1885 - Refactor to return SchoolExternalToolWithId without cast
	async findById(schoolExternalToolId: EntityId): Promise<SchoolExternalToolWithId> {
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolRepo.findById(schoolExternalToolId);

		return schoolExternalTool as SchoolExternalToolWithId;
	}

	async findSchoolExternalTools(query: SchoolExternalToolQuery): Promise<SchoolExternalTool[]> {
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
			...tool,
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

		if (this.toolFeatures.toolStatusWithoutVersions) {
			try {
				await this.schoolExternalToolValidationService.validate(tool);

				status.isOutdatedOnScopeSchool = false;

				return status;
			} catch (err) {
				return status;
			}
		}

		if (externalTool.version <= tool.toolVersion) {
			status.isOutdatedOnScopeSchool = false;

			return status;
		}

		return status;
	}

	async deleteSchoolExternalToolById(schoolExternalToolId: EntityId): Promise<void> {
		await this.schoolExternalToolRepo.deleteById(schoolExternalToolId);
	}

	async saveSchoolExternalTool(schoolExternalTool: SchoolExternalTool): Promise<SchoolExternalTool> {
		let createdSchoolExternalTool: SchoolExternalTool = await this.schoolExternalToolRepo.save(schoolExternalTool);
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
