import { EventService } from '@infra/event';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ContextExternalToolRepo } from '@shared/repo';
import { CommonToolService } from '../../common/service';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { ContextExternalTool, ContextRef } from '../domain';
import { ContextExternalToolQuery } from '../uc/dto/context-external-tool.types';
import { ContextExternalToolDeletedEventContent, ContextExternalToolsDeletedEvent } from './event';
import { RestrictedContextMismatchLoggable } from './restricted-context-mismatch-loggabble';

@Injectable()
export class ContextExternalToolService {
	constructor(
		private readonly contextExternalToolRepo: ContextExternalToolRepo,
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly commonToolService: CommonToolService,
		private readonly eventService: EventService
	) {}

	public async findContextExternalTools(query: ContextExternalToolQuery): Promise<ContextExternalTool[]> {
		const contextExternalTools: ContextExternalTool[] = await this.contextExternalToolRepo.find(query);

		return contextExternalTools;
	}

	public async findByIdOrFail(contextExternalToolId: EntityId): Promise<ContextExternalTool> {
		const tool: ContextExternalTool = await this.contextExternalToolRepo.findById(contextExternalToolId);

		return tool;
	}

	public async findById(contextExternalToolId: EntityId): Promise<ContextExternalTool | null> {
		const tool: ContextExternalTool | null = await this.contextExternalToolRepo.findByIdOrNull(contextExternalToolId);

		return tool;
	}

	public async saveContextExternalTool(contextExternalTool: ContextExternalTool): Promise<ContextExternalTool> {
		const savedContextExternalTool: ContextExternalTool = await this.contextExternalToolRepo.save(contextExternalTool);

		return savedContextExternalTool;
	}

	public async deleteBySchoolExternalToolId(schoolExternalToolId: EntityId): Promise<void> {
		const contextExternalTools: ContextExternalTool[] = await this.contextExternalToolRepo.find({
			schoolToolRef: {
				schoolToolId: schoolExternalToolId,
			},
		});

		await this.contextExternalToolRepo.delete(contextExternalTools);

		this.dispatchEvent(contextExternalTools);
	}

	private dispatchEvent(externalToolsToDelete: ContextExternalTool[]): void {
		const eventContent: ContextExternalToolDeletedEventContent[] = externalToolsToDelete.map(
			(contextExternalTool: ContextExternalTool): ContextExternalToolDeletedEventContent => {
				return {
					contextId: contextExternalTool.contextRef.id,
					contextType: contextExternalTool.contextRef.type,
				};
			}
		);

		this.eventService.emitEvent(new ContextExternalToolsDeletedEvent(eventContent));
	}

	public async deleteContextExternalTool(contextExternalTool: ContextExternalTool): Promise<void> {
		await this.contextExternalToolRepo.delete(contextExternalTool);
	}

	public async findAllByContext(contextRef: ContextRef): Promise<ContextExternalTool[]> {
		const contextExternalTools: ContextExternalTool[] = await this.contextExternalToolRepo.find({
			context: contextRef,
		});

		return contextExternalTools;
	}

	public async checkContextRestrictions(contextExternalTool: ContextExternalTool): Promise<void> {
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(
			contextExternalTool.schoolToolRef.schoolToolId
		);

		const externalTool: ExternalTool = await this.externalToolService.findById(schoolExternalTool.toolId);

		if (this.commonToolService.isContextRestricted(externalTool, contextExternalTool.contextRef.type)) {
			throw new RestrictedContextMismatchLoggable(externalTool.name, contextExternalTool.contextRef.type);
		}
	}
}
