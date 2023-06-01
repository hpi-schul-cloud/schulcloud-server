import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ContextRef, EntityId } from '@shared/domain';
import { ContextExternalToolDO } from '@shared/domain/domainobject/tool';
import { ContextExternalToolRepo } from '@shared/repo';
import {
	AuthorizableReferenceType,
	AuthorizationContext,
	AuthorizationLoaderService,
	AuthorizationService,
} from '@src/modules/authorization';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
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

		if (contextExternalTools.length === 0) {
			throw new NotFoundException(`ContextExternalTool with id ${contextExternalToolId} not found`);
		}

		return contextExternalTools[0];
	}

	async createContextExternalTool(contextExternalTool: ContextExternalToolDO): Promise<ContextExternalToolDO> {
		const newContextExternalTool: ContextExternalToolDO = new ContextExternalToolDO({
			contextToolName: contextExternalTool.contextToolName,
			contextRef: contextExternalTool.contextRef,
			toolVersion: contextExternalTool.toolVersion,
			parameters: contextExternalTool.parameters,
			schoolToolRef: contextExternalTool.schoolToolRef,
			createdAt: new Date(),
			updatedAt: new Date(),
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

	findById(id: EntityId): Promise<ContextExternalToolDO> {
		return this.getContextExternalToolById(id);
	}

	async findAllByContext(contextRef: ContextRef): Promise<ContextExternalToolDO[]> {
		const contextExternalTools: ContextExternalToolDO[] = await this.contextExternalToolRepo.find({
			context: contextRef,
		});

		return contextExternalTools;
	}
}
