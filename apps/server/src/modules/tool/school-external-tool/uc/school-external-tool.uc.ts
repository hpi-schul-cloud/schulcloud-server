import { AuthorizationContext, AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { School, SchoolService } from '@src/modules/school';
import { CommonToolMetadataService } from '../../common/service/common-tool-metadata.service';
import { SchoolExternalTool, SchoolExternalToolMetadata, SchoolExternalToolProps } from '../domain';
import { SchoolExternalToolService, SchoolExternalToolValidationService } from '../service';
import { SchoolExternalToolQueryInput } from './dto/school-external-tool.types';
import { ExternalToolService } from '@modules/tool';
import { ExternalTool } from '@modules/tool/external-tool/domain';

@Injectable()
export class SchoolExternalToolUc {
	constructor(
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly schoolExternalToolValidationService: SchoolExternalToolValidationService,
		private readonly commonToolMetadataService: CommonToolMetadataService,
		@Inject(forwardRef(() => AuthorizationService)) private readonly authorizationService: AuthorizationService,
		private readonly schoolService: SchoolService,
		private readonly externalToolService: ExternalToolService
	) {}

	async findSchoolExternalTools(userId: EntityId, query: SchoolExternalToolQueryInput): Promise<SchoolExternalTool[]> {
		let tools: SchoolExternalTool[] = [];
		if (query.schoolId) {
			tools = await this.schoolExternalToolService.findSchoolExternalTools({ schoolId: query.schoolId });

			tools = await this.getContextRestrictions(tools);

			const user: User = await this.authorizationService.getUserWithPermissions(userId);
			const school: School = await this.schoolService.getSchoolById(query.schoolId);

			const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);

			await this.ensureSchoolPermissions(user, tools, school, context);
		}

		return tools;
	}

	private async getContextRestrictions(tools: SchoolExternalTool[]): Promise<SchoolExternalTool[]> {
		const schoolExternalTools = tools.map(async tool => {
			const externalTool: ExternalTool = await this.externalToolService.findById(tool.toolId)
			tool.restrictToContexts = externalTool.restrictToContexts;
			return tool;
		})

		return Promise.all(schoolExternalTools)
	}

	async createSchoolExternalTool(
		userId: EntityId,
		schoolExternalToolDto: SchoolExternalToolProps
	): Promise<SchoolExternalTool> {
		const schoolExternalTool = new SchoolExternalTool({ ...schoolExternalToolDto });

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const school: School = await this.schoolService.getSchoolById(schoolExternalTool.schoolId);

		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);
		this.authorizationService.checkPermission(user, school, context);

		await this.schoolExternalToolValidationService.validate(schoolExternalTool);

		const createdSchoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.saveSchoolExternalTool(
			schoolExternalTool
		);

		return createdSchoolExternalTool;
	}

	private async ensureSchoolPermissions(
		user: User,
		tools: SchoolExternalTool[],
		school: School,
		context: AuthorizationContext
	): Promise<void> {
		await Promise.all(tools.map(() => this.authorizationService.checkPermission(user, school, context)));
	}

	async deleteSchoolExternalTool(userId: EntityId, schoolExternalToolId: EntityId): Promise<void> {
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(schoolExternalToolId);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const school: School = await this.schoolService.getSchoolById(schoolExternalTool.schoolId);

		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);
		this.authorizationService.checkPermission(user, school, context);

		await this.schoolExternalToolService.deleteSchoolExternalTool(schoolExternalTool);
	}

	async getSchoolExternalTool(userId: EntityId, schoolExternalToolId: EntityId): Promise<SchoolExternalTool> {
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(schoolExternalToolId);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const school: School = await this.schoolService.getSchoolById(schoolExternalTool.schoolId);

		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);
		this.authorizationService.checkPermission(user, school, context);

		return schoolExternalTool;
	}

	async updateSchoolExternalTool(
		userId: EntityId,
		schoolExternalToolId: string,
		schoolExternalToolDto: SchoolExternalToolProps
	): Promise<SchoolExternalTool> {
		const schoolExternalTool = new SchoolExternalTool({ ...schoolExternalToolDto });

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const school: School = await this.schoolService.getSchoolById(schoolExternalTool.schoolId);

		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);
		this.authorizationService.checkPermission(user, school, context);

		await this.schoolExternalToolValidationService.validate(schoolExternalTool);

		const updated: SchoolExternalTool = new SchoolExternalTool({
			...schoolExternalToolDto,
			id: schoolExternalToolId,
		});

		const saved: SchoolExternalTool = await this.schoolExternalToolService.saveSchoolExternalTool(updated);

		return saved;
	}

	async getMetadataForSchoolExternalTool(
		userId: EntityId,
		schoolExternalToolId: EntityId
	): Promise<SchoolExternalToolMetadata> {
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(schoolExternalToolId);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const school: School = await this.schoolService.getSchoolById(schoolExternalTool.schoolId);

		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);
		this.authorizationService.checkPermission(user, school, context);

		const metadata: SchoolExternalToolMetadata = await this.commonToolMetadataService.getMetadataForSchoolExternalTool(
			schoolExternalToolId
		);

		return metadata;
	}
}
