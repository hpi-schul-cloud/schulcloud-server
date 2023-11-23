import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { SchoolExternalToolRepo } from '@shared/repo';
import { ToolConfigurationStatus } from '../../common/enum';
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
		let configurationStatus: ToolConfigurationStatus = new ToolConfigurationStatus({
			latest: false,
			isDisabled: false,
			isOutdatedOnScopeContext: false,
			isOutdatedOnScopeSchool: true,
			isUnkown: false,
		});

		if (this.toolFeatures.toolStatusWithoutVersions) {
			try {
				await this.schoolExternalToolValidationService.validate(tool);
				configurationStatus = new ToolConfigurationStatus({
					latest: true,
					isDisabled: false,
					isOutdatedOnScopeContext: false,
					isOutdatedOnScopeSchool: false,
					isUnkown: false,
				});

				return configurationStatus;
			} catch (err) {
				return configurationStatus;
			}
		}

		if (externalTool.version <= tool.toolVersion) {
			configurationStatus = new ToolConfigurationStatus({
				latest: true,
				isDisabled: false,
				isOutdatedOnScopeContext: false,
				isOutdatedOnScopeSchool: false,
				isUnkown: false,
			});

			return configurationStatus;
		}

		return configurationStatus;
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
