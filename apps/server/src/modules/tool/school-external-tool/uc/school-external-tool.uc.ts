import { AuthorizationContext, AuthorizationContextBuilder } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { LegacySchoolDo } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { CommonToolMetadataService } from '../../common/service/common-tool-metadata.service';
import { ToolPermissionHelper } from '../../common/uc/tool-permission-helper';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { SchoolExternalTool, SchoolExternalToolMetadata } from '../domain';
import { SchoolExternalToolService, SchoolExternalToolValidationService } from '../service';
import { SchoolExternalToolDto, SchoolExternalToolQueryInput } from './dto/school-external-tool.types';

@Injectable()
export class SchoolExternalToolUc {
	constructor(
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly schoolExternalToolValidationService: SchoolExternalToolValidationService,
		private readonly commonToolMetadataService: CommonToolMetadataService,
		private readonly toolPermissionHelper: ToolPermissionHelper
	) {}

	async findSchoolExternalTools(userId: EntityId, query: SchoolExternalToolQueryInput): Promise<SchoolExternalTool[]> {
		let tools: SchoolExternalTool[] = [];
		if (query.schoolId) {
			tools = await this.schoolExternalToolService.findSchoolExternalTools({ schoolId: query.schoolId });
			const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);

			const [user, school] = await this.toolPermissionHelper.getIrgendwas(userId, query.schoolId);
			this.toolPermissionHelper.ensureSchoolPermissions(user as User, school as LegacySchoolDo, context);

			await this.ensureSchoolPermissions(user as User, tools, school as LegacySchoolDo, context);
		}
		return tools;
	}

	async createSchoolExternalTool(
		userId: EntityId,
		schoolExternalToolDto: SchoolExternalToolDto
	): Promise<SchoolExternalTool> {
		const schoolExternalTool = new SchoolExternalTool({ ...schoolExternalToolDto });
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);

		const [user, school] = await this.toolPermissionHelper.getIrgendwas(userId, schoolExternalTool.schoolId);
		this.toolPermissionHelper.ensureSchoolPermissions(user as User, school as LegacySchoolDo, context);

		await this.schoolExternalToolValidationService.validate(schoolExternalTool);

		const createdSchoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.saveSchoolExternalTool(
			schoolExternalTool
		);

		return createdSchoolExternalTool;
	}

	private async ensureSchoolPermissions(
		user: User,
		tools: SchoolExternalTool[],
		school: LegacySchoolDo,
		context: AuthorizationContext
	): Promise<void> {
		await Promise.all(tools.map(() => this.toolPermissionHelper.ensureSchoolPermissions(user, school, context)));
	}

	async deleteSchoolExternalTool(userId: EntityId, schoolExternalToolId: EntityId): Promise<void> {
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(schoolExternalToolId);
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);

		const [user, school] = await this.toolPermissionHelper.getIrgendwas(userId, schoolExternalTool.schoolId);
		this.toolPermissionHelper.ensureSchoolPermissions(user as User, school as LegacySchoolDo, context);

		await Promise.all([
			this.contextExternalToolService.deleteBySchoolExternalToolId(schoolExternalToolId),
			this.schoolExternalToolService.deleteSchoolExternalToolById(schoolExternalToolId),
		]);
	}

	async getSchoolExternalTool(userId: EntityId, schoolExternalToolId: EntityId): Promise<SchoolExternalTool> {
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(schoolExternalToolId);
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);

		const [user, school] = await this.toolPermissionHelper.getIrgendwas(userId, schoolExternalTool.schoolId);
		this.toolPermissionHelper.ensureSchoolPermissions(user as User, school as LegacySchoolDo, context);

		return schoolExternalTool;
	}

	async updateSchoolExternalTool(
		userId: EntityId,
		schoolExternalToolId: string,
		schoolExternalToolDto: SchoolExternalToolDto
	): Promise<SchoolExternalTool> {
		const schoolExternalTool = new SchoolExternalTool({ ...schoolExternalToolDto });
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);

		const [user, school] = await this.toolPermissionHelper.getIrgendwas(userId, schoolExternalTool.schoolId);
		this.toolPermissionHelper.ensureSchoolPermissions(user as User, school as LegacySchoolDo, context);

		await this.schoolExternalToolValidationService.validate(schoolExternalTool);

		const updated: SchoolExternalTool = new SchoolExternalTool({
			...schoolExternalToolDto,
			id: schoolExternalToolId,
		});

		const saved = await this.schoolExternalToolService.saveSchoolExternalTool(updated);
		return saved;
	}

	async getMetadataForSchoolExternalTool(
		userId: EntityId,
		schoolExternalToolId: EntityId
	): Promise<SchoolExternalToolMetadata> {
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(schoolExternalToolId);

		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);

		const [user, school] = await this.toolPermissionHelper.getIrgendwas(userId, schoolExternalTool.schoolId);
		this.toolPermissionHelper.ensureSchoolPermissions(user as User, school as LegacySchoolDo, context);

		const metadata: SchoolExternalToolMetadata = await this.commonToolMetadataService.getMetadataForSchoolExternalTool(
			schoolExternalToolId
		);

		return metadata;
	}
}
