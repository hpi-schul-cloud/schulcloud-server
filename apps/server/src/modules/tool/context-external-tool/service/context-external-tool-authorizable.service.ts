import { AuthorizationLoaderService } from '@src/modules/authorization';
import { EntityId } from '@shared/domain';
import { ContextExternalToolRepo } from '@shared/repo';
import { Injectable } from '@nestjs/common';
import { ContextExternalTool } from '../domain';

@Injectable()
export class ContextExternalToolAuthorizableService implements AuthorizationLoaderService {
	constructor(private readonly contextExternalToolRepo: ContextExternalToolRepo) {}

	async findById(id: EntityId): Promise<ContextExternalTool> {
		const contextExternalTool: ContextExternalTool = await this.contextExternalToolRepo.findById(id);

		return contextExternalTool;
	}
}
