import { Injectable } from '@nestjs/common';
import { EntityId, Permission } from '@shared/domain';
import { Action, AuthorizationService, AuthorizableReferenceType } from '@src/modules/authorization';
import { SchoolExternalToolService, SchoolExternalToolValidationService } from '../service';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { SchoolExternalToolDto, SchoolExternalToolQueryInput } from './dto/school-external-tool.types';
import { SchoolExternalTool } from '../domain';
import { SchoolExternalToolComposite } from './dto/school-external-tool-composite';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolLogoService, ExternalToolService } from '../../external-tool/service';

@Injectable()
export class SchoolExternalToolUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly schoolExternalToolValidationService: SchoolExternalToolValidationService,
		private readonly externalToolService: ExternalToolService,
		private readonly externalToolLogoService: ExternalToolLogoService
	) {}

	async findSchoolExternalTools(
		userId: EntityId,
		query: SchoolExternalToolQueryInput,
		logoUrlTemplate: string
	): Promise<SchoolExternalToolComposite[]> {
		let tools: SchoolExternalTool[] = [];
		if (query.schoolId) {
			await this.ensureSchoolPermission(userId, query.schoolId);
			tools = await this.schoolExternalToolService.findSchoolExternalTools({ schoolId: query.schoolId });
		}

		const toolsComposite: SchoolExternalToolComposite[] = await this.addLogoUrlsToTools(logoUrlTemplate, tools);

		return toolsComposite;
	}

	async createSchoolExternalTool(
		userId: EntityId,
		schoolExternalToolDto: SchoolExternalToolDto
	): Promise<SchoolExternalTool> {
		const schoolExternalTool = new SchoolExternalTool({ ...schoolExternalToolDto });

		await this.ensureSchoolPermission(userId, schoolExternalToolDto.schoolId);
		await this.schoolExternalToolValidationService.validate(schoolExternalTool);

		const createdSchoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.saveSchoolExternalTool(
			schoolExternalTool
		);

		return createdSchoolExternalTool;
	}

	private async ensureSchoolPermission(userId: EntityId, schoolId: EntityId): Promise<void> {
		return this.authorizationService.checkPermissionByReferences(userId, AuthorizableReferenceType.School, schoolId, {
			action: Action.read,
			requiredPermissions: [Permission.SCHOOL_TOOL_ADMIN],
		});
	}

	async deleteSchoolExternalTool(userId: EntityId, schoolExternalToolId: EntityId): Promise<void> {
		await this.ensureSchoolExternalToolPermission(userId, schoolExternalToolId);

		await Promise.all([
			this.contextExternalToolService.deleteBySchoolExternalToolId(schoolExternalToolId),
			this.schoolExternalToolService.deleteSchoolExternalToolById(schoolExternalToolId),
		]);
	}

	async getSchoolExternalTool(userId: EntityId, schoolExternalToolId: EntityId): Promise<SchoolExternalTool> {
		await this.ensureSchoolExternalToolPermission(userId, schoolExternalToolId);

		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.getSchoolExternalToolById(
			schoolExternalToolId
		);
		return schoolExternalTool;
	}

	async updateSchoolExternalTool(
		userId: EntityId,
		schoolExternalToolId: string,
		schoolExternalToolDto: SchoolExternalToolDto
	): Promise<SchoolExternalTool> {
		const schoolExternalTool = new SchoolExternalTool({ ...schoolExternalToolDto });

		await this.ensureSchoolExternalToolPermission(userId, schoolExternalToolId);
		await this.schoolExternalToolValidationService.validate(schoolExternalTool);

		const updated: SchoolExternalTool = new SchoolExternalTool({
			...schoolExternalToolDto,
			id: schoolExternalToolId,
		});

		const saved = await this.schoolExternalToolService.saveSchoolExternalTool(updated);
		return saved;
	}

	private async ensureSchoolExternalToolPermission(userId: EntityId, schoolExternalToolId: EntityId): Promise<void> {
		return this.authorizationService.checkPermissionByReferences(
			userId,
			AuthorizableReferenceType.SchoolExternalToolEntity,
			schoolExternalToolId,
			{
				action: Action.read,
				requiredPermissions: [Permission.SCHOOL_TOOL_ADMIN],
			}
		);
	}

	private async fetchExternalTool(schoolExternalTool: SchoolExternalTool): Promise<ExternalTool> {
		return this.externalToolService.findExternalToolById(schoolExternalTool.toolId);
	}

	private async addLogoUrlsToTools(
		logoUrlTemplate: string,
		tools: SchoolExternalTool[]
	): Promise<SchoolExternalToolComposite[]> {
		const toolsComposite = await Promise.all(
			tools.map(async (schoolExternalTool): Promise<SchoolExternalToolComposite> => {
				const tool: ExternalTool = await this.fetchExternalTool(schoolExternalTool);

				const schoolExternalToolComposite: SchoolExternalToolComposite = new SchoolExternalToolComposite(
					schoolExternalTool
				);

				schoolExternalToolComposite.logoUrl = this.externalToolLogoService.buildLogoUrl(logoUrlTemplate, tool);
				return schoolExternalToolComposite;
			})
		);
		return toolsComposite;
	}
}
