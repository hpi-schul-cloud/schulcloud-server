import { Injectable } from '@nestjs/common';
import { ContextExternalToolRepo } from '@shared/repo';
import { ContextExternalToolDO } from '@shared/domain/domainobject/tool';
import { EntityId } from '@shared/domain';
import { ToolContextType } from '../interface';

@Injectable()
export class ContextExternalToolService {
	constructor(private readonly contextExternalToolRepo: ContextExternalToolRepo) {}

	async getContextExternalToolById(contextExternalToolId: EntityId): Promise<ContextExternalToolDO> {
		const contextExternalTool = await this.contextExternalToolRepo.findById(contextExternalToolId);

		return contextExternalTool;
	}

	async createContextExternalTool(contextExternalTool: ContextExternalToolDO): Promise<ContextExternalToolDO> {
		const createdContextExternalTool: ContextExternalToolDO = await this.contextExternalToolRepo.save(
			contextExternalTool
		);

		return createdContextExternalTool;
	}

	async deleteBySchoolExternalToolId(schoolExternalToolId: EntityId) {
		const contextExternalTools: ContextExternalToolDO[] = await this.contextExternalToolRepo.find({
			schoolToolId: schoolExternalToolId,
		});

		await this.contextExternalToolRepo.delete(contextExternalTools);
	}

	async deleteContextExternalTool(contextExternalTool: ContextExternalToolDO): Promise<void> {
		await this.contextExternalToolRepo.delete(contextExternalTool);
	}

	async getContextExternalToolsForContext(contextType: ToolContextType, contextId: string) {
		const contextExternalTools: ContextExternalToolDO[] = await this.contextExternalToolRepo.find({
			contextType,
			contextId,
		});

		return contextExternalTools;
	}
}
