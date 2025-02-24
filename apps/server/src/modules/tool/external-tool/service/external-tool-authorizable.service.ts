import {
	AuthorizableReferenceType,
	AuthorizationInjectionService,
	AuthorizationLoaderService,
} from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ExternalTool } from '../domain';
import { ExternalToolRepo } from '../repo';

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
