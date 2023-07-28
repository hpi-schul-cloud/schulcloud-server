import { Injectable } from '@nestjs/common';
import { EntityId, IFindOptions, Page, Permission, User } from '@shared/domain';
import { AuthorizationService } from '@src/modules/authorization';
import { ExternalToolSearchQuery } from '../../common/interface';
import { ExternalToolService, ExternalToolValidationService } from '../service';
import { ExternalToolCreate, ExternalToolUpdate } from './dto';
import { ExternalToolConfigDO, ExternalToolDO } from '../domain';

@Injectable()
export class ExternalToolUc {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly authorizationService: AuthorizationService,
		private readonly toolValidationService: ExternalToolValidationService
	) {}

	async createExternalTool(userId: EntityId, externalToolDO: ExternalToolCreate): Promise<ExternalToolDO> {
		const externalTool = new ExternalToolDO({ ...externalToolDO });

		await this.ensurePermission(userId, Permission.TOOL_ADMIN);
		await this.toolValidationService.validateCreate(externalTool);

		const tool: Promise<ExternalToolDO> = this.externalToolService.createExternalTool(externalTool);

		return tool;
	}

	async updateExternalTool(
		userId: EntityId,
		toolId: string,
		externalTool: ExternalToolUpdate
	): Promise<ExternalToolDO> {
		await this.ensurePermission(userId, Permission.TOOL_ADMIN);
		await this.toolValidationService.validateUpdate(toolId, externalTool);

		const loaded: ExternalToolDO = await this.externalToolService.findExternalToolById(toolId);
		const configToUpdate: ExternalToolConfigDO = { ...loaded.config, ...externalTool.config };
		const toUpdate: ExternalToolDO = new ExternalToolDO({
			...loaded,
			...externalTool,
			config: configToUpdate,
			version: loaded.version,
		});

		const saved = await this.externalToolService.updateExternalTool(toUpdate, loaded);
		return saved;
	}

	async findExternalTool(
		userId: EntityId,
		query: ExternalToolSearchQuery,
		options: IFindOptions<ExternalToolDO>
	): Promise<Page<ExternalToolDO>> {
		await this.ensurePermission(userId, Permission.TOOL_ADMIN);

		const tools: Page<ExternalToolDO> = await this.externalToolService.findExternalTools(query, options);
		return tools;
	}

	async getExternalTool(userId: EntityId, toolId: EntityId): Promise<ExternalToolDO> {
		await this.ensurePermission(userId, Permission.TOOL_ADMIN);

		const tool: ExternalToolDO = await this.externalToolService.findExternalToolById(toolId);
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
