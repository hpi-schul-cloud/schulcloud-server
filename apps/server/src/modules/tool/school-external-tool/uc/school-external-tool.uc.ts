import { Injectable } from '@nestjs/common';
import { EntityId, Permission, SchoolExternalToolDO } from '@shared/domain';
import { Action, AllowedAuthorizationEntityType, AuthorizationService } from '@src/modules/authorization';
import { SchoolExternalToolService, SchoolExternalToolValidationService } from '../service';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { SchoolExternalTool, SchoolExternalToolQueryInput } from './dto';

@Injectable()
export class SchoolExternalToolUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly schoolExternalToolValidationService: SchoolExternalToolValidationService
	) {}

	async findSchoolExternalTools(
		userId: EntityId,
		query: SchoolExternalToolQueryInput
	): Promise<SchoolExternalToolDO[]> {
		let tools: SchoolExternalToolDO[] = [];
		if (query.schoolId) {
			await this.ensureSchoolPermission(userId, query.schoolId);
			tools = await this.schoolExternalToolService.findSchoolExternalTools({ schoolId: query.schoolId });
		}
		return tools;
	}

	async createSchoolExternalTool(
		userId: EntityId,
		schoolExternalTool: SchoolExternalTool
	): Promise<SchoolExternalToolDO> {
		await this.ensureSchoolPermission(userId, schoolExternalTool.schoolId);

		await this.schoolExternalToolValidationService.validate(schoolExternalTool);

		const createdSchoolExternalTool: SchoolExternalToolDO = await this.schoolExternalToolService.saveSchoolExternalTool(
			schoolExternalTool
		);

		return createdSchoolExternalTool;
	}

	private async ensureSchoolPermission(userId: EntityId, schoolId: EntityId): Promise<void> {
		return this.authorizationService.checkPermissionByReferences(
			userId,
			AllowedAuthorizationEntityType.School,
			schoolId,
			{
				action: Action.read,
				requiredPermissions: [Permission.SCHOOL_TOOL_ADMIN],
			}
		);
	}

	async deleteSchoolExternalTool(userId: EntityId, schoolExternalToolId: EntityId): Promise<void> {
		await this.ensureSchoolExternalToolPermission(userId, schoolExternalToolId);

		await Promise.all([
			this.contextExternalToolService.deleteBySchoolExternalToolId(schoolExternalToolId),
			this.schoolExternalToolService.deleteSchoolExternalToolById(schoolExternalToolId),
		]);
	}

	async getSchoolExternalTool(userId: EntityId, schoolExternalToolId: EntityId): Promise<SchoolExternalToolDO> {
		await this.ensureSchoolExternalToolPermission(userId, schoolExternalToolId);

		const schoolExternalTool: SchoolExternalToolDO = await this.schoolExternalToolService.getSchoolExternalToolById(
			schoolExternalToolId
		);
		return schoolExternalTool;
	}

	async updateSchoolExternalTool(
		userId: EntityId,
		schoolExternalToolId: string,
		schoolExternalTool: SchoolExternalTool
	): Promise<SchoolExternalToolDO> {
		await this.ensureSchoolExternalToolPermission(userId, schoolExternalToolId);
		await this.schoolExternalToolValidationService.validate(schoolExternalTool);

		const updated: SchoolExternalToolDO = new SchoolExternalToolDO({
			...schoolExternalTool,
			id: schoolExternalToolId,
		});

		const saved = await this.schoolExternalToolService.saveSchoolExternalTool(updated);
		return saved;
	}

	private async ensureSchoolExternalToolPermission(userId: EntityId, schoolExternalToolId: EntityId): Promise<void> {
		return this.authorizationService.checkPermissionByReferences(
			userId,
			AllowedAuthorizationEntityType.SchoolExternalTool,
			schoolExternalToolId,
			{
				action: Action.read,
				requiredPermissions: [Permission.SCHOOL_TOOL_ADMIN],
			}
		);
	}
}
