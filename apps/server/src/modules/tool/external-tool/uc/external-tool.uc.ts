import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { School, SchoolService } from '@modules/school';
import { User } from '@modules/user/repo';
import { Inject, Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions, Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { ExternalToolSearchQuery } from '../../common/interface';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { TOOL_CONFIG_TOKEN, ToolConfig } from '../../tool-config';
import {
	BasicToolConfig,
	ExternalTool,
	ExternalToolConfig,
	ExternalToolDatasheetTemplateData,
	Lti11ToolConfig,
	Oauth2ToolConfig,
} from '../domain';
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
		private readonly datasheetPdfService: DatasheetPdfService,
		private readonly externalToolImageService: ExternalToolImageService,
		@Inject(DefaultEncryptionService) private readonly encryptionService: EncryptionService,
		@Inject(TOOL_CONFIG_TOKEN) private readonly config: ToolConfig
	) {}

	public async createExternalTool(userId: EntityId, externalToolCreate: ExternalToolCreate): Promise<ExternalTool> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [Permission.TOOL_ADMIN]);

		externalToolCreate.config = this.encryptLtiSecret(externalToolCreate);

		const tool: ExternalTool = await this.validateAndSaveExternalTool(externalToolCreate);

		return tool;
	}

	public async importExternalTools(
		userId: EntityId,
		externalTools: ExternalToolCreate[]
	): Promise<ExternalToolImportResult[]> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [Permission.TOOL_ADMIN]);

		const results: ExternalToolImportResult[] = [];

		for (const externalTool of externalTools) {
			const result: ExternalToolImportResult = new ExternalToolImportResult({
				toolName: externalTool.name,
				mediumId: externalTool.medium?.mediumId,
				mediumSourceId: externalTool.medium?.mediaSourceId,
			});

			try {
				externalTool.config = this.encryptLtiSecret(externalTool);

				// eslint-disable-next-line no-await-in-loop
				const savedTool: ExternalTool = await this.validateAndSaveExternalTool(externalTool);

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

	private async validateAndSaveExternalTool(externalToolCreate: ExternalToolCreate): Promise<ExternalTool> {
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
				savedExternalTool.id
			);

			savedExternalTool = await this.externalToolService.updateExternalTool(savedExternalTool);
		}

		return savedExternalTool;
	}

	public async updateExternalTool(
		userId: EntityId,
		toolId: string,
		externalToolUpdate: ExternalToolUpdate
	): Promise<ExternalTool> {
		const currentExternalTool: ExternalTool = await this.externalToolService.findById(toolId);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(
			user,
			currentExternalTool,
			AuthorizationContextBuilder.write([Permission.TOOL_ADMIN])
		);

		externalToolUpdate.config = this.encryptLtiSecret(externalToolUpdate);

		const { thumbnailUrl, ...externalToolUpdateProps } = externalToolUpdate;

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
				await this.externalToolImageService.deleteImageFile(currentExternalTool.thumbnail.fileRecordId);

				pendingExternalTool.thumbnail = undefined;
			}

			if (thumbnailUrl) {
				pendingExternalTool.thumbnail = await this.externalToolImageService.uploadImageFileFromUrl(
					thumbnailUrl,
					ExternalTool.thumbnailNameAffix,
					pendingExternalTool.id
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
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [Permission.TOOL_ADMIN]);

		query.isTemplateOrDraft = true;

		const tools: Page<ExternalTool> = await this.externalToolService.findExternalTools(query, options);

		return tools;
	}

	public async getExternalTool(userId: EntityId, toolId: EntityId): Promise<ExternalTool> {
		const externalTool: ExternalTool = await this.externalToolService.findById(toolId);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(
			user,
			externalTool,
			AuthorizationContextBuilder.read([Permission.TOOL_ADMIN])
		);

		return externalTool;
	}

	public async deleteExternalTool(userId: EntityId, externalToolId: EntityId): Promise<void> {
		const externalTool: ExternalTool = await this.externalToolService.findById(externalToolId);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(
			user,
			externalTool,
			AuthorizationContextBuilder.write([Permission.TOOL_ADMIN])
		);

		await this.externalToolImageService.deleteAllFiles(externalToolId);

		await this.externalToolService.deleteExternalTool(externalTool);
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
				this.config.scTitle,
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

	private encryptLtiSecret(
		externalTool: ExternalToolCreate | ExternalToolUpdate
	): BasicToolConfig | Lti11ToolConfig | Oauth2ToolConfig {
		if (ExternalTool.isLti11Config(externalTool.config) && externalTool.config.secret) {
			const encrypted = this.encryptionService.encrypt(externalTool.config.secret);

			const updatedConfig = new Lti11ToolConfig({ ...externalTool.config, secret: encrypted });

			return updatedConfig;
		}

		return externalTool.config;
	}
}
