import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ContextRef, EntityId } from '@shared/domain';
import { ContextExternalToolDO } from '@shared/domain/domainobject/tool';
import { ContextExternalToolRepo } from '@shared/repo';
import { AuthorizableReferenceType, AuthorizationContext, AuthorizationService } from '@src/modules/authorization';
import { ContextExternalToolQuery } from '../uc/dto/context-external-tool.types';
import { ContextTypeMapper } from '../../common/mapper';

@Injectable()
export class ContextExternalToolService {
	constructor(
		private readonly contextExternalToolRepo: ContextExternalToolRepo,
		@Inject(forwardRef(() => AuthorizationService))
		private readonly authorizationService: AuthorizationService
	) {}

	async findContextExternalTools(query: ContextExternalToolQuery): Promise<ContextExternalToolDO[]> {
		const contextExternalTools: ContextExternalToolDO[] = await this.contextExternalToolRepo.find(query);

		return contextExternalTools;
	}

	async getContextExternalToolById(contextExternalToolId: EntityId): Promise<ContextExternalToolDO> {
		const contextExternalTools: ContextExternalToolDO[] = await this.contextExternalToolRepo.find({
			id: contextExternalToolId,
		});

		if (contextExternalTools.length === 0) {
			throw new NotFoundException(`ContextExternalTool with id ${contextExternalToolId} not found`);
		}

		return contextExternalTools[0];
	}

	async createContextExternalTool(contextExternalTool: ContextExternalToolDO): Promise<ContextExternalToolDO> {
		const newContextExternalTool: ContextExternalToolDO = new ContextExternalToolDO({
			displayName: contextExternalTool.displayName,
			contextRef: contextExternalTool.contextRef,
			toolVersion: contextExternalTool.toolVersion,
			parameters: contextExternalTool.parameters,
			schoolToolRef: contextExternalTool.schoolToolRef,
		});

		const createdContextExternalTool: ContextExternalToolDO = await this.contextExternalToolRepo.save(
			newContextExternalTool
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

	public async ensureContextPermissions(
		userId: EntityId,
		contextExternalToolDO: ContextExternalToolDO,
		context: AuthorizationContext
	): Promise<void> {
		if (contextExternalToolDO.id) {
			await this.authorizationService.checkPermissionByReferences(
				userId,
				AuthorizableReferenceType.ContextExternalTool,
				contextExternalToolDO.id,
				context
			);
		}

		await this.authorizationService.checkPermissionByReferences(
			userId,
			ContextTypeMapper.mapContextTypeToAllowedAuthorizationEntityType(contextExternalToolDO.contextRef.type),
			contextExternalToolDO.contextRef.id,
			context
		);
	}

	async findAllByContext(contextRef: ContextRef): Promise<ContextExternalToolDO[]> {
		const contextExternalTools: ContextExternalToolDO[] = await this.contextExternalToolRepo.find({
			context: contextRef,
		});

		return contextExternalTools;
	}
}
