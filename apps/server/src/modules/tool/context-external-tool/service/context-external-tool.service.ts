import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ContextExternalToolRepo } from '@shared/repo';
import { ContextExternalToolQuery } from '../uc/dto/context-external-tool.types';
import { ContextExternalTool, ContextRef } from '../domain';

@Injectable()
export class ContextExternalToolService {
	constructor(private readonly contextExternalToolRepo: ContextExternalToolRepo) {}

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

	async findAllByContext(contextRef: ContextRef): Promise<ContextExternalTool[]> {
		const contextExternalTools: ContextExternalTool[] = await this.contextExternalToolRepo.find({
			context: contextRef,
		});

		return contextExternalTools;
	}
}
