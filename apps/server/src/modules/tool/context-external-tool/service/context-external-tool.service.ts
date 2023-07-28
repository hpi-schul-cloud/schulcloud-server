import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ContextExternalToolRepo } from '@shared/repo';
import { AuthorizableReferenceType, AuthorizationContext, AuthorizationService } from '@src/modules/authorization';
import { ContextExternalToolQuery } from '../uc/dto/context-external-tool.types';
import { ContextTypeMapper } from '../../common/mapper';
import { ContextExternalTool, ContextRef } from '../domain';

@Injectable()
export class ContextExternalToolService {
	constructor(
		private readonly contextExternalToolRepo: ContextExternalToolRepo,
		@Inject(forwardRef(() => AuthorizationService))
		private readonly authorizationService: AuthorizationService
	) {}

	async findContextExternalTools(query: ContextExternalToolQuery): Promise<ContextExternalTool[]> {
		const contextExternalTools: ContextExternalTool[] = await this.contextExternalToolRepo.find(query);

		return contextExternalTools;
	}

	async getContextExternalToolById(contextExternalToolId: EntityId): Promise<ContextExternalTool> {
		const contextExternalTools: ContextExternalTool[] = await this.contextExternalToolRepo.find({
			id: contextExternalToolId,
		});

		if (contextExternalTools.length === 0) {
			throw new NotFoundException(`ContextExternalTool with id ${contextExternalToolId} not found`);
		}

		return contextExternalTools[0];
	}

	async createContextExternalTool(contextExternalTool: ContextExternalTool): Promise<ContextExternalTool> {
		const newContextExternalTool: ContextExternalTool = new ContextExternalTool({
			displayName: contextExternalTool.displayName,
			contextRef: contextExternalTool.contextRef,
			toolVersion: contextExternalTool.toolVersion,
			parameters: contextExternalTool.parameters,
			schoolToolRef: contextExternalTool.schoolToolRef,
		});

		const createdContextExternalTool: ContextExternalTool = await this.contextExternalToolRepo.save(
			newContextExternalTool
		);

		return createdContextExternalTool;
	}

	async deleteBySchoolExternalToolId(schoolExternalToolId: EntityId) {
		const contextExternalTools: ContextExternalTool[] = await this.contextExternalToolRepo.find({
			schoolToolRef: {
				schoolToolId: schoolExternalToolId,
			},
		});

		await this.contextExternalToolRepo.delete(contextExternalTools);
	}

	async deleteContextExternalTool(contextExternalTool: ContextExternalTool): Promise<void> {
		await this.contextExternalToolRepo.delete(contextExternalTool);
	}

	public async ensureContextPermissions(
		userId: EntityId,
		contextExternalTool: ContextExternalTool,
		context: AuthorizationContext
	): Promise<void> {
		if (contextExternalTool.id) {
			await this.authorizationService.checkPermissionByReferences(
				userId,
				AuthorizableReferenceType.ContextExternalToolEntity,
				contextExternalTool.id,
				context
			);
		}

		await this.authorizationService.checkPermissionByReferences(
			userId,
			ContextTypeMapper.mapContextTypeToAllowedAuthorizationEntityType(contextExternalTool.contextRef.type),
			contextExternalTool.contextRef.id,
			context
		);
	}

	async findAllByContext(contextRef: ContextRef): Promise<ContextExternalTool[]> {
		const contextExternalTools: ContextExternalTool[] = await this.contextExternalToolRepo.find({
			context: contextRef,
		});

		return contextExternalTools;
	}
}
