import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface/permission.enum';
import { EntityId } from '@shared/domain/types/entity-id';
import { AuthorizationContextBuilder } from '@src/modules/authorization/authorization-context.builder';
import { AuthorizationContext } from '@src/modules/authorization/types/authorization-context.interface';
import { ToolPermissionHelper } from '../../common/uc/tool-permission-helper';
import { ContextExternalToolService } from '../../context-external-tool/service/context-external-tool.service';
import { SchoolExternalTool } from '../domain/school-external-tool.do';
import { SchoolExternalToolValidationService } from '../service/school-external-tool-validation.service';
import { SchoolExternalToolService } from '../service/school-external-tool.service';
import { SchoolExternalToolDto, SchoolExternalToolQueryInput } from './dto/school-external-tool.types';

@Injectable()
export class SchoolExternalToolUc {
	constructor(
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly schoolExternalToolValidationService: SchoolExternalToolValidationService,
		private readonly toolPermissionHelper: ToolPermissionHelper
	) {}

	async findSchoolExternalTools(userId: EntityId, query: SchoolExternalToolQueryInput): Promise<SchoolExternalTool[]> {
		let tools: SchoolExternalTool[] = [];
		if (query.schoolId) {
			tools = await this.schoolExternalToolService.findSchoolExternalTools({ schoolId: query.schoolId });
			const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);

			await this.ensureSchoolPermissions(userId, tools, context);
		}
		return tools;
	}

	async createSchoolExternalTool(
		userId: EntityId,
		schoolExternalToolDto: SchoolExternalToolDto
	): Promise<SchoolExternalTool> {
		const schoolExternalTool = new SchoolExternalTool({ ...schoolExternalToolDto });
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);

		await this.toolPermissionHelper.ensureSchoolPermissions(userId, schoolExternalTool, context);
		await this.schoolExternalToolValidationService.validate(schoolExternalTool);

		const createdSchoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.saveSchoolExternalTool(
			schoolExternalTool
		);

		return createdSchoolExternalTool;
	}

	private async ensureSchoolPermissions(
		userId: EntityId,
		tools: SchoolExternalTool[],
		context: AuthorizationContext
	): Promise<void> {
		await Promise.all(
			tools.map(async (tool: SchoolExternalTool) =>
				this.toolPermissionHelper.ensureSchoolPermissions(userId, tool, context)
			)
		);
	}

	async deleteSchoolExternalTool(userId: EntityId, schoolExternalToolId: EntityId): Promise<void> {
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(schoolExternalToolId);
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);

		await this.toolPermissionHelper.ensureSchoolPermissions(userId, schoolExternalTool, context);

		await Promise.all([
			this.contextExternalToolService.deleteBySchoolExternalToolId(schoolExternalToolId),
			this.schoolExternalToolService.deleteSchoolExternalToolById(schoolExternalToolId),
		]);
	}

	async getSchoolExternalTool(userId: EntityId, schoolExternalToolId: EntityId): Promise<SchoolExternalTool> {
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(schoolExternalToolId);
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);

		await this.toolPermissionHelper.ensureSchoolPermissions(userId, schoolExternalTool, context);
		return schoolExternalTool;
	}

	async updateSchoolExternalTool(
		userId: EntityId,
		schoolExternalToolId: string,
		schoolExternalToolDto: SchoolExternalToolDto
	): Promise<SchoolExternalTool> {
		const schoolExternalTool = new SchoolExternalTool({ ...schoolExternalToolDto });
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);

		await this.toolPermissionHelper.ensureSchoolPermissions(userId, schoolExternalTool, context);
		await this.schoolExternalToolValidationService.validate(schoolExternalTool);

		const updated: SchoolExternalTool = new SchoolExternalTool({
			...schoolExternalToolDto,
			id: schoolExternalToolId,
		});

		const saved = await this.schoolExternalToolService.saveSchoolExternalTool(updated);
		return saved;
	}
}
