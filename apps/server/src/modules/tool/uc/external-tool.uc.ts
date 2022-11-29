import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { EntityId, IFindOptions, Permission, User } from '@shared/domain';
import { ExternalToolDO, Oauth2ToolConfigDO } from '@shared/domain/domainobject/external-tool';
import { AuthorizationService } from '@src/modules/authorization';
import { Page } from '@shared/domain/interface/page';
import { ExternalToolService } from '../service/external-tool.service';

@Injectable()
export class ExternalToolUc {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly authorizationService: AuthorizationService
	) {}

	async createExternalTool(userId: EntityId, externalToolDO: ExternalToolDO): Promise<ExternalToolDO> {
		await this.ensurePermission(userId);

		await this.checkValidation(externalToolDO);

		const tool: Promise<ExternalToolDO> = this.externalToolService.createExternalTool(externalToolDO);
		return tool;
	}

	private async ensurePermission(userId: string) {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [Permission.TOOL_ADMIN]);
	}

	private async checkValidation(externalToolDO: ExternalToolDO) {
		if (!(await this.externalToolService.isNameUnique(externalToolDO))) {
			throw new UnprocessableEntityException(`The tool name "${externalToolDO.name}" is already used`);
		}
		if (externalToolDO.parameters && this.externalToolService.hasDuplicateAttributes(externalToolDO.parameters)) {
			throw new UnprocessableEntityException(
				`The tool: ${externalToolDO.name} contains multiple of the same custom parameters`
			);
		}
		if (externalToolDO.parameters && !this.externalToolService.validateByRegex(externalToolDO.parameters)) {
			throw new UnprocessableEntityException(
				`A custom Parameter of the tool: ${externalToolDO.name} has wrong regex attribute.`
			);
		}

		if (
			externalToolDO.config instanceof Oauth2ToolConfigDO &&
			!(await this.externalToolService.isClientIdUnique(externalToolDO.config))
		) {
			throw new UnprocessableEntityException(`The Client Id of the tool: ${externalToolDO.name} is already used`);
		}
	}

	async findExternalTool(
		userId: EntityId,
		query: Partial<ExternalToolDO>,
		options: IFindOptions<ExternalToolDO>
	): Promise<Page<ExternalToolDO>> {
		await this.ensurePermission(userId);

		const tools: Page<ExternalToolDO> = await this.externalToolService.findExternalTools(query, options);
		return tools;
	}

	async getExternalTool(userId: EntityId, toolId: EntityId): Promise<ExternalToolDO> {
		await this.ensurePermission(userId);

		const tool: ExternalToolDO = await this.externalToolService.findExternalToolById(toolId);
		return tool;
	}

	async deleteExternalTool(userId: string, toolId: string): Promise<void> {
		await this.ensurePermission(userId);

		const promise: Promise<void> = this.externalToolService.deleteExternalTool(toolId);
		return promise;
	}
}
