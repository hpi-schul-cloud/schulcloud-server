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
	ExternalToolLogoService,
	ExternalToolService,
	ExternalToolValidationService,
} from '../service';
import { ExternalToolCreate, ExternalToolUpdate } from './dto';

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
		private readonly datasheetPdfService: DatasheetPdfService
	) {}

	async createExternalTool(userId: EntityId, externalToolCreate: ExternalToolCreate): Promise<ExternalTool> {
		await this.ensurePermission(userId, Permission.TOOL_ADMIN);

		const externalTool = new ExternalTool({ ...externalToolCreate });
		externalTool.logo = await this.externalToolLogoService.fetchLogo(externalTool);

		await this.toolValidationService.validateCreate(externalTool);

		const tool: ExternalTool = await this.externalToolService.createExternalTool(externalTool);

		return tool;
	}

	async updateExternalTool(userId: EntityId, toolId: string, externalTool: ExternalToolUpdate): Promise<ExternalTool> {
		await this.ensurePermission(userId, Permission.TOOL_ADMIN);

		externalTool.logo = await this.externalToolLogoService.fetchLogo(externalTool);

		const loaded: ExternalTool = await this.externalToolService.findById(toolId);

		const configToUpdate: ExternalToolConfig = { ...loaded.config, ...externalTool.config };
		const toUpdate: ExternalTool = new ExternalTool({
			...loaded,
			...externalTool,
			config: configToUpdate,
		});

		await this.toolValidationService.validateUpdate(toolId, toUpdate);

		const saved: ExternalTool = await this.externalToolService.updateExternalTool(toUpdate, loaded);

		return saved;
	}

	async findExternalTool(
		userId: EntityId,
		query: ExternalToolSearchQuery,
		options: IFindOptions<ExternalTool>
	): Promise<Page<ExternalTool>> {
		await this.ensurePermission(userId, Permission.TOOL_ADMIN);

		const tools: Page<ExternalTool> = await this.externalToolService.findExternalTools(query, options);
		return tools;
	}

	async getExternalTool(userId: EntityId, toolId: EntityId): Promise<ExternalTool> {
		await this.ensurePermission(userId, Permission.TOOL_ADMIN);

		const tool: ExternalTool = await this.externalToolService.findById(toolId);
		return tool;
	}

	async deleteExternalTool(userId: EntityId, toolId: EntityId): Promise<void> {
		await this.ensurePermission(userId, Permission.TOOL_ADMIN);

		const promise: Promise<void> = this.externalToolService.deleteExternalTool(toolId);
		return promise;
	}

	async getMetadataForExternalTool(userId: EntityId, toolId: EntityId): Promise<ExternalToolMetadata> {
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
