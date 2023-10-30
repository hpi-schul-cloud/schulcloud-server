import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types/entity-id';
import { ContextExternalToolRepo } from '@shared/repo/contextexternaltool/context-external-tool.repo';
import { AuthorizationLoaderService } from '@src/modules/authorization/types/authorization-loader-service';
import { ContextExternalTool } from '../domain/context-external-tool.do';

@Injectable()
export class ContextExternalToolAuthorizableService implements AuthorizationLoaderService {
	constructor(private readonly contextExternalToolRepo: ContextExternalToolRepo) {}

	async findById(id: EntityId): Promise<ContextExternalTool> {
		const contextExternalTool: ContextExternalTool = await this.contextExternalToolRepo.findById(id);

		return contextExternalTool;
	}
}
