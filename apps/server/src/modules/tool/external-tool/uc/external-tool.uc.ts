import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject/page';
import { User } from '@shared/domain/entity/user.entity';
import { IFindOptions } from '@shared/domain/interface/find-options';
import { Permission } from '@shared/domain/interface/permission.enum';
import { EntityId } from '@shared/domain/types/entity-id';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { ExternalToolSearchQuery } from '../../common/interface/external-tool-search-query';
import { ExternalToolConfig } from '../domain/config/external-tool-config.do';
import { ExternalTool } from '../domain/external-tool.do';
import { ExternalToolLogoService } from '../service/external-tool-logo.service';
import { ExternalToolValidationService } from '../service/external-tool-validation.service';
import { ExternalToolService } from '../service/external-tool.service';
import { ExternalToolCreate, ExternalToolUpdate } from './dto/external-tool.types';

@Injectable()
export class ExternalToolUc {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly authorizationService: AuthorizationService,
		private readonly toolValidationService: ExternalToolValidationService,
		private readonly externalToolLogoService: ExternalToolLogoService
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

		await this.toolValidationService.validateUpdate(toolId, externalTool);

		const loaded: ExternalTool = await this.externalToolService.findById(toolId);
		const configToUpdate: ExternalToolConfig = { ...loaded.config, ...externalTool.config };
		const toUpdate: ExternalTool = new ExternalTool({
			...loaded,
			...externalTool,
			config: configToUpdate,
			version: loaded.version,
		});

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

	private async ensurePermission(userId: EntityId, permission: Permission) {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [permission]);
	}
}
