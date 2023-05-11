import { Injectable } from '@nestjs/common';
import { ContextExternalToolRepo } from '@shared/repo';
import { ContextExternalToolDO } from '@shared/domain/domainobject/tool';
import { EntityId } from '@shared/domain';

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
		const courseExternalTools: ContextExternalToolDO[] = await this.contextExternalToolRepo.find({
			schoolToolId: schoolExternalToolId,
		});

		await this.contextExternalToolRepo.delete(courseExternalTools);
	}

	async deleteContextExternalTool(contextExternalTool: ContextExternalToolDO): Promise<void> {
		await this.contextExternalToolRepo.delete(contextExternalTool);
	}
}
