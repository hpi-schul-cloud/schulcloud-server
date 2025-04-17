import { AuthorizationContext, AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { School, SchoolService } from '@modules/school';
import { User } from '@modules/user/repo';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { CommonToolValidationService } from '../../common/service';
import { ExternalToolService } from '../../external-tool';
import { ExternalToolUtilizationService } from '../../tool-utilization';
import { SchoolExternalTool, SchoolExternalToolProps } from '../domain';
import { SchoolExternalToolService } from '../service';
import { SchoolExternalToolQueryInput } from './dto/school-external-tool.types';

@Injectable()
export class SchoolExternalToolUc {
	constructor(
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly externalToolService: ExternalToolService,
		private readonly commonToolUtilizationService: ExternalToolUtilizationService,
		private readonly commonToolValidationService: CommonToolValidationService,
		@Inject(forwardRef(() => AuthorizationService)) private readonly authorizationService: AuthorizationService,
		private readonly schoolService: SchoolService
	) {}

	private async validate(schoolExternalTool: SchoolExternalTool): Promise<void> {
		const loadedExternalTool = await this.externalToolService.findById(schoolExternalTool.toolId);

		const errors = this.commonToolValidationService.validateParameters(loadedExternalTool, schoolExternalTool);

		if (errors.length) {
			throw errors[0];
		}
	}

	public async findSchoolExternalTools(
		userId: EntityId,
		query: SchoolExternalToolQueryInput
	): Promise<SchoolExternalTool[]> {
		let tools: SchoolExternalTool[] = [];
		if (query.schoolId) {
			tools = await this.schoolExternalToolService.findSchoolExternalTools({ schoolId: query.schoolId });

			const user = await this.authorizationService.getUserWithPermissions(userId);
			const school = await this.schoolService.getSchoolById(query.schoolId);

			const context = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);

			await this.ensureSchoolPermissions(user, tools, school, context);
		}

		return tools;
	}

	public async createSchoolExternalTool(
		userId: EntityId,
		schoolExternalToolDto: SchoolExternalToolProps
	): Promise<SchoolExternalTool> {
		const schoolExternalTool = new SchoolExternalTool({ ...schoolExternalToolDto });

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const school = await this.schoolService.getSchoolById(schoolExternalTool.schoolId);

		const context = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);
		this.authorizationService.checkPermission(user, school, context);

		await this.validate(schoolExternalTool);

		const createdSchoolExternalTool = await this.schoolExternalToolService.saveSchoolExternalTool(schoolExternalTool);

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

	public async deleteSchoolExternalTool(userId: EntityId, schoolExternalToolId: EntityId): Promise<void> {
		const schoolExternalTool = await this.schoolExternalToolService.findById(schoolExternalToolId);

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const school = await this.schoolService.getSchoolById(schoolExternalTool.schoolId);

		const context = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);
		this.authorizationService.checkPermission(user, school, context);

		await this.schoolExternalToolService.deleteSchoolExternalTool(schoolExternalTool);
	}

	public async getSchoolExternalTool(userId: EntityId, schoolExternalToolId: EntityId): Promise<SchoolExternalTool> {
		const schoolExternalTool = await this.schoolExternalToolService.findById(schoolExternalToolId);

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const school = await this.schoolService.getSchoolById(schoolExternalTool.schoolId);

		const context = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);
		this.authorizationService.checkPermission(user, school, context);

		return schoolExternalTool;
	}

	public async updateSchoolExternalTool(
		userId: EntityId,
		schoolExternalToolId: string,
		schoolExternalToolDto: SchoolExternalToolProps
	): Promise<SchoolExternalTool> {
		const schoolExternalTool = new SchoolExternalTool({ ...schoolExternalToolDto });

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const school = await this.schoolService.getSchoolById(schoolExternalTool.schoolId);

		const context = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);
		this.authorizationService.checkPermission(user, school, context);

		await this.validate(schoolExternalTool);

		const updated = new SchoolExternalTool({
			...schoolExternalToolDto,
			id: schoolExternalToolId,
		});

		const saved = await this.schoolExternalToolService.saveSchoolExternalTool(updated);

		return saved;
	}
}
