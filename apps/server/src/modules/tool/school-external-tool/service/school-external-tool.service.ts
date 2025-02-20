import { MediaSource, MediaSourceDataFormat, MediaSourceLicenseType, MediaSourceService } from '@modules/media-source';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ValidationError } from '@shared/common/error';
import { EntityId } from '@shared/domain/types';
import { CommonToolDeleteService, CommonToolValidationService } from '../../common/service';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { ToolConfig } from '../../tool-config';
import { SchoolExternalTool, SchoolExternalToolConfigurationStatus, SchoolExternalToolMedium } from '../domain';
import { SchoolExternalToolQuery } from '../uc/dto/school-external-tool.types';
import { SchoolExternalToolRepo } from '../repo';

@Injectable()
export class SchoolExternalToolService {
	constructor(
		private readonly schoolExternalToolRepo: SchoolExternalToolRepo,
		private readonly externalToolService: ExternalToolService,
		private readonly commonToolValidationService: CommonToolValidationService,
		private readonly commonToolDeleteService: CommonToolDeleteService,
		private readonly mediaSourceService: MediaSourceService,
		private readonly configService: ConfigService<ToolConfig, true>
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

		let medium: SchoolExternalToolMedium | undefined;
		if (this.configService.get('FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED')) {
			medium = await this.determineMedium(externalTool);
		}

		const schoolExternalTool: SchoolExternalTool = new SchoolExternalTool({
			...tool.getProps(),
			name: externalTool.name,
			status,
			restrictToContexts: externalTool.restrictToContexts,
			medium,
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

	private async determineMedium(externalTool: ExternalTool): Promise<SchoolExternalToolMedium | undefined> {
		if (!externalTool.medium) {
			return undefined;
		}

		let mediaSourceName: string | undefined;
		let mediaSourceLicenseType: MediaSourceLicenseType | undefined;
		if (externalTool.medium.mediaSourceId) {
			const mediaSource: MediaSource | null = await this.mediaSourceService.findBySourceId(
				externalTool.medium.mediaSourceId
			);

			mediaSourceName = mediaSource?.name;
			mediaSourceLicenseType =
				mediaSource?.format === MediaSourceDataFormat.VIDIS
					? MediaSourceLicenseType.SCHOOL_LICENSE
					: MediaSourceLicenseType.USER_LICENSE;
		}

		const medium: SchoolExternalToolMedium = new SchoolExternalToolMedium({
			mediumId: externalTool.medium.mediumId,
			mediaSourceId: externalTool.medium.mediaSourceId,
			mediaSourceName,
			mediaSourceLicenseType,
		});

		return medium;
	}

	public async deleteSchoolExternalTool(schoolExternalTool: SchoolExternalTool): Promise<void> {
		await this.commonToolDeleteService.deleteSchoolExternalTool(schoolExternalTool);
	}

	public async saveSchoolExternalTool(schoolExternalTool: SchoolExternalTool): Promise<SchoolExternalTool> {
		let createdSchoolExternalTool: SchoolExternalTool = await this.schoolExternalToolRepo.save(schoolExternalTool);

		createdSchoolExternalTool = await this.enrichWithDataFromExternalTool(createdSchoolExternalTool);

		return createdSchoolExternalTool;
	}
}
