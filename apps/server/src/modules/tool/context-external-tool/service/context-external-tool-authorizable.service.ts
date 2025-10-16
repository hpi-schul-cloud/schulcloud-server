import {
	AuthorizableReferenceType,
	AuthorizationInjectionService,
	AuthorizationLoaderService,
} from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ContextExternalTool } from '../domain';
import { ContextExternalToolRepo } from '../repo/mikro-orm';

@Injectable()
export class ContextExternalToolAuthorizableService implements AuthorizationLoaderService {
	constructor(
		private readonly contextExternalToolRepo: ContextExternalToolRepo,
		injectionService: AuthorizationInjectionService
	) {
		injectionService.injectReferenceLoader(AuthorizableReferenceType.ContextExternalToolEntity, this);
	}

	public async findById(id: EntityId): Promise<ContextExternalTool> {
		const contextExternalTool: ContextExternalTool = await this.contextExternalToolRepo.findById(id);

		return contextExternalTool;
	}
}
