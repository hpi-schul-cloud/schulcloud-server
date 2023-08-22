import { Injectable } from '@nestjs/common';
import { EntityId, Permission } from '@shared/domain';
import { AuthorizationContext, AuthorizationContextBuilder } from '@src/modules/authorization';
import { SchoolExternalToolService, SchoolExternalToolValidationService } from '../service';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { SchoolExternalToolDto, SchoolExternalToolQueryInput } from './dto/school-external-tool.types';
import { SchoolExternalTool } from '../domain';
import { ToolPermissionHelper } from '../../common/uc/tool-permission-helper';

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
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.getSchoolExternalToolById(
			schoolExternalToolId
		);
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);

		await this.toolPermissionHelper.ensureSchoolPermissions(userId, schoolExternalTool, context);

		await Promise.all([
			this.contextExternalToolService.deleteBySchoolExternalToolId(schoolExternalToolId),
			this.schoolExternalToolService.deleteSchoolExternalToolById(schoolExternalToolId),
		]);
	}

	async getSchoolExternalTool(userId: EntityId, schoolExternalToolId: EntityId): Promise<SchoolExternalTool> {
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.getSchoolExternalToolById(
			schoolExternalToolId
		);
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
