import { Injectable } from '@nestjs/common';
import { Actions, EntityId, Permission } from '@shared/domain';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { AuthorizationService } from '@src/modules/authorization';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';
import { CourseExternalToolService, SchoolExternalToolService, SchoolExternalToolValidationService } from '../service';
import { SchoolExternalTool, SchoolExternalToolQueryInput } from './dto/school-external-tool.types';

@Injectable()
export class SchoolExternalToolUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly courseExternalToolService: CourseExternalToolService,
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

		await this.schoolExternalToolValidationService.validateCreate(schoolExternalTool);

		const createdSchoolExternalTool: SchoolExternalToolDO =
			await this.schoolExternalToolService.createSchoolExternalTool(schoolExternalTool);

		return createdSchoolExternalTool;
	}

	private async ensureSchoolPermission(userId: EntityId, schoolId: EntityId): Promise<void> {
		return this.authorizationService.checkPermissionByReferences(
			userId,
			AllowedAuthorizationEntityType.School,
			schoolId,
			{
				action: Actions.read,
				requiredPermissions: [Permission.SCHOOL_TOOL_ADMIN],
			}
		);
	}

	async deleteSchoolExternalTool(userId: EntityId, schoolExternalToolId: EntityId): Promise<void> {
		await this.ensureSchoolExternalToolPermission(userId, schoolExternalToolId);

		await Promise.all([
			this.courseExternalToolService.deleteBySchoolExternalToolId(schoolExternalToolId),
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
		await this.schoolExternalToolValidationService.validateUpdate(schoolExternalToolId, schoolExternalTool);

		const loaded: SchoolExternalToolDO = await this.schoolExternalToolService.getSchoolExternalToolById(
			schoolExternalToolId
		);
		const updated: SchoolExternalToolDO = new SchoolExternalToolDO({
			...loaded,
			...schoolExternalTool,
		});

		const saved = await this.schoolExternalToolService.updateSchoolExternalTool(updated);
		return saved;
	}

	private async ensureSchoolExternalToolPermission(userId: EntityId, schoolExternalToolId: EntityId): Promise<void> {
		return this.authorizationService.checkPermissionByReferences(
			userId,
			AllowedAuthorizationEntityType.SchoolExternalTool,
			schoolExternalToolId,
			{
				action: Actions.read,
				requiredPermissions: [Permission.SCHOOL_TOOL_ADMIN],
			}
		);
	}
}
