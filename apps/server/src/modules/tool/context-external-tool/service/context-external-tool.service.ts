import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ContextExternalToolRepo } from '@shared/repo';
import { ContextExternalTool, ContextRef } from '../domain';
import { ContextExternalToolQuery } from '../uc/dto/context-external-tool.types';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { RestrictedContextMismatchLoggable } from './restricted-context-mismatch-loggabble';
import { CommonToolService } from '../../common/service';

@Injectable()
export class ContextExternalToolService {
	constructor(
		private readonly contextExternalToolRepo: ContextExternalToolRepo,
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly commonToolService: CommonToolService
	) {}

	public async findContextExternalTools(query: ContextExternalToolQuery): Promise<ContextExternalTool[]> {
		const contextExternalTools: ContextExternalTool[] = await this.contextExternalToolRepo.find(query);

		return contextExternalTools;
	}

	async findByIdOrFail(contextExternalToolId: EntityId): Promise<ContextExternalTool> {
		const tool: ContextExternalTool = await this.contextExternalToolRepo.findById(contextExternalToolId);

		return tool;
	}

	async findById(contextExternalToolId: EntityId): Promise<ContextExternalTool | null> {
		const tool: ContextExternalTool | null = await this.contextExternalToolRepo.findByIdOrNull(contextExternalToolId);

		return tool;
	}

	public async saveContextExternalTool(contextExternalTool: ContextExternalTool): Promise<ContextExternalTool> {
		const savedContextExternalTool: ContextExternalTool = await this.contextExternalToolRepo.save(contextExternalTool);

		return savedContextExternalTool;
	}

	public async deleteBySchoolExternalToolId(schoolExternalToolId: EntityId) {
		const contextExternalTools: ContextExternalTool[] = await this.contextExternalToolRepo.find({
			schoolToolRef: {
				schoolToolId: schoolExternalToolId,
			},
		});

		await this.contextExternalToolRepo.delete(contextExternalTools);
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
