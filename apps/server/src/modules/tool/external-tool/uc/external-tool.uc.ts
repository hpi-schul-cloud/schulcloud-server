import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationService } from '@modules/authorization';
import { School, SchoolService } from '@modules/school';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { SchoolExternalToolService } from '@modules/tool/school-external-tool/service';
import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import { IFindOptions, Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { ExternalToolSearchQuery } from '../../common/interface';
import { CommonToolMetadataService } from '../../common/service/common-tool-metadata.service';
import { ExternalTool, ExternalToolConfig, ExternalToolDatasheetTemplateData, ExternalToolMetadata } from '../domain';
import { ExternalToolDatasheetMapper } from '../mapper/external-tool-datasheet.mapper';
import {
	DatasheetPdfService,
	ExternalToolImageService,
	ExternalToolLogoService,
	ExternalToolService,
	ExternalToolValidationService,
} from '../service';
import { ExternalToolCreate, ExternalToolImportResult, ExternalToolUpdate } from './dto';

@Injectable()
export class ExternalToolUc {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly schoolService: SchoolService,
		private readonly authorizationService: AuthorizationService,
		private readonly toolValidationService: ExternalToolValidationService,
		private readonly externalToolLogoService: ExternalToolLogoService,
		private readonly commonToolMetadataService: CommonToolMetadataService,
		private readonly datasheetPdfService: DatasheetPdfService,
		private readonly externalToolImageService: ExternalToolImageService
	) {}

	public async createExternalTool(
		userId: EntityId,
		externalToolCreate: ExternalToolCreate,
		jwt: string
	): Promise<ExternalTool> {
		await this.ensurePermission(userId, Permission.TOOL_ADMIN);

		const tool: ExternalTool = await this.validateAndSaveExternalTool(externalToolCreate, jwt);

		return tool;
	}

	public async importExternalTools(
		userId: EntityId,
		externalTools: ExternalToolCreate[],
		jwt: string
	): Promise<ExternalToolImportResult[]> {
		await this.ensurePermission(userId, Permission.TOOL_ADMIN);

		const results: ExternalToolImportResult[] = [];

		for (const externalTool of externalTools) {
			const result: ExternalToolImportResult = new ExternalToolImportResult({
				toolName: externalTool.name,
				mediumId: externalTool.medium?.mediumId,
				mediumSourceId: externalTool.medium?.mediaSourceId,
			});

			try {
				// eslint-disable-next-line no-await-in-loop
				const savedTool: ExternalTool = await this.validateAndSaveExternalTool(externalTool, jwt);

				result.toolId = savedTool.id;
			} catch (error: unknown) {
				if (error instanceof Error) {
					result.error = error.message;
				}
			}

			results.push(result);
		}

		return results;
	}

	private async validateAndSaveExternalTool(
		externalToolCreate: ExternalToolCreate,
		jwt: string
	): Promise<ExternalTool> {
		const { thumbnailUrl, ...externalToolCreateProps } = externalToolCreate;

		const pendingExternalTool: ExternalTool = new ExternalTool({
			...externalToolCreateProps,
			id: new ObjectId().toHexString(),
		});
		pendingExternalTool.logo = await this.externalToolLogoService.fetchLogo(pendingExternalTool);

		await this.toolValidationService.validateCreate(pendingExternalTool);

		let savedExternalTool: ExternalTool = await this.externalToolService.createExternalTool(pendingExternalTool);

		if (thumbnailUrl) {
			savedExternalTool.thumbnail = await this.externalToolImageService.uploadImageFileFromUrl(
				thumbnailUrl,
				ExternalTool.thumbnailNameAffix,
				savedExternalTool.id,
				jwt
			);

			savedExternalTool = await this.externalToolService.updateExternalTool(savedExternalTool);
		}

		return savedExternalTool;
	}

	public async updateExternalTool(
		userId: EntityId,
		toolId: string,
		externalToolUpdate: ExternalToolUpdate,
		jwt: string
	): Promise<ExternalTool> {
		await this.ensurePermission(userId, Permission.TOOL_ADMIN);

		const { thumbnailUrl, ...externalToolUpdateProps } = externalToolUpdate;

		const currentExternalTool: ExternalTool = await this.externalToolService.findById(toolId);

		// Use secrets from existing config
		const updatedConfigProps: ExternalToolConfig = { ...currentExternalTool.config, ...externalToolUpdateProps.config };

		const pendingExternalTool: ExternalTool = new ExternalTool({
			...currentExternalTool.getProps(),
			...externalToolUpdateProps,
			config: updatedConfigProps,
		});
		pendingExternalTool.logo = await this.externalToolLogoService.fetchLogo(pendingExternalTool);

		await this.toolValidationService.validateUpdate(toolId, pendingExternalTool);

		if (thumbnailUrl !== currentExternalTool.thumbnail?.uploadUrl) {
			if (currentExternalTool.thumbnail) {
				await this.externalToolImageService.deleteImageFile(currentExternalTool.thumbnail.fileRecordId, jwt);

				pendingExternalTool.thumbnail = undefined;
			}

			if (thumbnailUrl) {
				pendingExternalTool.thumbnail = await this.externalToolImageService.uploadImageFileFromUrl(
					thumbnailUrl,
					ExternalTool.thumbnailNameAffix,
					pendingExternalTool.id,
					jwt
				);
			}
		}

		const savedExternalTool: ExternalTool = await this.externalToolService.updateExternalTool(pendingExternalTool);

		return savedExternalTool;
	}

	public async findExternalTool(
		userId: EntityId,
		query: ExternalToolSearchQuery,
		options: IFindOptions<ExternalTool>
	): Promise<Page<ExternalTool>> {
		await this.ensurePermission(userId, Permission.TOOL_ADMIN);

		const tools: Page<ExternalTool> = await this.externalToolService.findExternalTools(query, options);

		return tools;
	}

	public async getExternalTool(userId: EntityId, toolId: EntityId): Promise<ExternalTool> {
		await this.ensurePermission(userId, Permission.TOOL_ADMIN);

		const tool: ExternalTool = await this.externalToolService.findById(toolId);

		return tool;
	}

	public async deleteExternalTool(userId: EntityId, externalToolId: EntityId, jwt: string): Promise<void> {
		await this.ensurePermission(userId, Permission.TOOL_ADMIN);

		await this.externalToolImageService.deleteAllFiles(externalToolId, jwt);

		await this.externalToolService.deleteExternalTool(externalToolId);
	}

	public async getMetadataForExternalTool(userId: EntityId, toolId: EntityId): Promise<ExternalToolMetadata> {
		// TODO N21-1496: Change External Tools to use authorizationService.checkPermission
		await this.ensurePermission(userId, Permission.TOOL_ADMIN);

		const metadata: ExternalToolMetadata = await this.commonToolMetadataService.getMetadataForExternalTool(toolId);

		return metadata;
	}

	private async ensurePermission(userId: EntityId, permission: Permission): Promise<void> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [permission]);
	}

	public async getDatasheet(userId: EntityId, externalToolId: EntityId): Promise<Buffer> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkOneOfPermissions(user, [Permission.TOOL_ADMIN, Permission.SCHOOL_TOOL_ADMIN]);

		const schoolExternalTools: SchoolExternalTool[] = await this.schoolExternalToolService.findSchoolExternalTools({
			schoolId: user.school.id,
			toolId: externalToolId,
		});

		let schoolExternalTool: SchoolExternalTool | undefined;
		let schoolName: string | undefined;
		if (schoolExternalTools.length) {
			schoolExternalTool = schoolExternalTools[0];

			if (this.authorizationService.hasAllPermissions(user, [Permission.SCHOOL_TOOL_ADMIN])) {
				const school: School = await this.schoolService.getSchoolById(schoolExternalTool.schoolId);
				schoolName = school.getInfo().name;
			}
		}

		const externalTool: ExternalTool = await this.externalToolService.findById(externalToolId);
		const dataSheetData: ExternalToolDatasheetTemplateData =
			ExternalToolDatasheetMapper.mapToExternalToolDatasheetTemplateData(
				externalTool,
				user.firstName,
				user.lastName,
				schoolExternalTool,
				schoolName
			);

		const buffer: Buffer = await this.datasheetPdfService.generatePdf(dataSheetData);

		return buffer;
	}

	public async createDatasheetFilename(externalToolId: EntityId): Promise<string> {
		const externalTool: ExternalTool = await this.externalToolService.findById(externalToolId);

		const date = new Date();
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();
		const dateString = `${year}-${month}-${day}`;

		const fileName = `CTL-Datenblatt-${externalTool.name}-${dateString}.pdf`;

		return fileName;
	}
}
