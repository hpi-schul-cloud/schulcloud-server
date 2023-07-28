import { Injectable } from '@nestjs/common';
import { EntityId, Permission } from '@shared/domain';
import { Action, AuthorizationService, AuthorizableReferenceType } from '@src/modules/authorization';
import { SchoolExternalToolService, SchoolExternalToolValidationService } from '../service';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { SchoolExternalToolDTO, SchoolExternalToolQueryInput } from './dto/school-external-tool.types';
import { SchoolExternalToolDO } from '../domain';

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
		schoolExternalToolDTO: SchoolExternalToolDTO
	): Promise<SchoolExternalToolDO> {
		const schoolExternalToolDO = new SchoolExternalToolDO({ ...schoolExternalToolDTO });

		await this.ensureSchoolPermission(userId, schoolExternalToolDTO.schoolId);
		await this.schoolExternalToolValidationService.validate(schoolExternalToolDO);

		const createdSchoolExternalTool: SchoolExternalToolDO = await this.schoolExternalToolService.saveSchoolExternalTool(
			schoolExternalToolDO
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

	async getSchoolExternalTool(userId: EntityId, schoolExternalToolId: EntityId): Promise<SchoolExternalToolDO> {
		await this.ensureSchoolExternalToolPermission(userId, schoolExternalToolId);

		const schoolExternalToolDO: SchoolExternalToolDO = await this.schoolExternalToolService.getSchoolExternalToolById(
			schoolExternalToolId
		);
		return schoolExternalToolDO;
	}

	async updateSchoolExternalTool(
		userId: EntityId,
		schoolExternalToolId: string,
		schoolExternalToolDTO: SchoolExternalToolDTO
	): Promise<SchoolExternalToolDO> {
		const schoolExternalToolDO = new SchoolExternalToolDO({ ...schoolExternalToolDTO });

		await this.ensureSchoolExternalToolPermission(userId, schoolExternalToolId);
		await this.schoolExternalToolValidationService.validate(schoolExternalToolDO);

		const updated: SchoolExternalToolDO = new SchoolExternalToolDO({
			...schoolExternalToolDTO,
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
}
