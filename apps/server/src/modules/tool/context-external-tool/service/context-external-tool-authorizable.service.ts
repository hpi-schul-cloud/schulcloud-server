import { AuthorizationLoaderService } from '@src/modules/authorization';
import { EntityId } from '@shared/domain';
import { ContextExternalToolRepo } from '@shared/repo';
import { Injectable } from '@nestjs/common';
import { ContextExternalToolDO } from '../domainobject';

@Injectable()
export class ContextExternalToolAuthorizableService implements AuthorizationLoaderService {
	constructor(private readonly contextExternalToolRepo: ContextExternalToolRepo) {}

	async findById(id: EntityId): Promise<ContextExternalToolDO> {
		const contextExternalTool: ContextExternalToolDO = await this.contextExternalToolRepo.findById(id);

		return contextExternalTool;
	}
}
