import {
	AuthorizableReferenceType,
	AuthorizationInjectionService,
	AuthorizationLoaderService,
} from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ContextExternalToolRepo } from '@shared/repo';
import { ContextExternalTool } from '../domain';

@Injectable()
export class ContextExternalToolAuthorizableService implements AuthorizationLoaderService {
	constructor(
		private readonly contextExternalToolRepo: ContextExternalToolRepo,
		injectionService: AuthorizationInjectionService
	) {
		injectionService.injectReferenceLoader(AuthorizableReferenceType.ContextExternalToolEntity, this);
	}

	async findById(id: EntityId): Promise<ContextExternalTool> {
		const contextExternalTool: ContextExternalTool = await this.contextExternalToolRepo.findById(id);

		return contextExternalTool;
	}
}
