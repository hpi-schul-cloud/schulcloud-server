import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ContextExternalToolRepo } from '@shared/repo';
import { ContextExternalToolDO } from '@shared/domain/domainobject/tool';
import { EntityId, Permission } from '@shared/domain';
import {
	Action,
	AllowedAuthorizationEntityType,
	AuthorizationContext,
	AuthorizationLoaderService,
	AuthorizationService,
} from '@src/modules/authorization';
import { ContextTypeMapper } from './mapper';

@Injectable()
export class ContextExternalToolService implements AuthorizationLoaderService {
	constructor(
		private readonly contextExternalToolRepo: ContextExternalToolRepo,
		@Inject(forwardRef(() => AuthorizationService))
		private readonly authorizationService: AuthorizationService
	) {}

	async getContextExternalToolById(contextExternalToolId: EntityId): Promise<ContextExternalToolDO> {
		const contextExternalTools: ContextExternalToolDO[] = await this.contextExternalToolRepo.find({
			id: contextExternalToolId,
		});

		return contextExternalTools[0];
	}

	async createContextExternalTool(contextExternalTool: ContextExternalToolDO): Promise<ContextExternalToolDO> {
		const createdContextExternalTool: ContextExternalToolDO = await this.contextExternalToolRepo.save(
			contextExternalTool
		);

		return createdContextExternalTool;
	}

	async deleteBySchoolExternalToolId(schoolExternalToolId: EntityId) {
		const contextExternalTools: ContextExternalToolDO[] = await this.contextExternalToolRepo.find({
			schoolToolRef: {
				schoolToolId: schoolExternalToolId,
			},
		});

		await this.contextExternalToolRepo.delete(contextExternalTools);
	}

	async deleteContextExternalTool(contextExternalTool: ContextExternalToolDO): Promise<void> {
		await this.contextExternalToolRepo.delete(contextExternalTool);
	}

	// TODO: add new permission CONTEXT_TOOL_USER to teacher or user role - maybe better teacher for testing first?
	public async ensureContextPermissions(
		userId: EntityId,
		contextExternalToolDO: ContextExternalToolDO,
		context: AuthorizationContext
	): Promise<void> {
		if (contextExternalToolDO.id) {
			await this.authorizationService.checkPermissionByReferences(
				userId,
				AllowedAuthorizationEntityType.ContextExternalTool,
				contextExternalToolDO.id,
				context
			);
		}

		await this.authorizationService.checkPermissionByReferences(
			userId,
			ContextTypeMapper.mapContextTypeToAllowedAuthorizationEntityType(contextExternalToolDO.contextType),
			contextExternalToolDO.contextId,
			context
		);
	}

	findById(id: EntityId): Promise<ContextExternalToolDO> {
		return this.getContextExternalToolById(id);
	}
}
