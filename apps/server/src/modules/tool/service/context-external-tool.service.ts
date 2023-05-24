import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ContextExternalToolDO } from '@shared/domain/domainobject/tool';
import { ContextExternalToolRepo } from '@shared/repo';
import { ContextExternalToolQuery } from '../uc/dto';

@Injectable()
export class ContextExternalToolService {
	constructor(private readonly contextExternalToolRepo: ContextExternalToolRepo) {}

	async findContextExternalTools(query: ContextExternalToolQuery): Promise<ContextExternalToolDO[]> {
		const contextExternalTools: ContextExternalToolDO[] = await this.contextExternalToolRepo.find(query);

		return contextExternalTools;
	}

	async getContextExternalToolById(contextExternalToolId: EntityId): Promise<ContextExternalToolDO> {
		const contextExternalTool: ContextExternalToolDO = await this.contextExternalToolRepo.findById(
			contextExternalToolId
		);

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
}
