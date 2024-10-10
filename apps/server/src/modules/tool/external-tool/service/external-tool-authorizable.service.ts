import {
	AuthorizableReferenceType,
	AuthorizationInjectionService,
	AuthorizationLoaderService,
} from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ExternalToolRepo } from '@shared/repo';
import { ExternalTool } from '../domain';

@Injectable()
export class ExternalToolAuthorizableService implements AuthorizationLoaderService {
	constructor(private readonly externalToolRepo: ExternalToolRepo, injectionService: AuthorizationInjectionService) {
		injectionService.injectReferenceLoader(AuthorizableReferenceType.ExternalTool, this);
	}

	async findById(id: EntityId): Promise<ExternalTool> {
		const externalTool: ExternalTool = await this.externalToolRepo.findById(id);

		return externalTool;
	}
}
