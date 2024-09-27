import { Injectable } from '@nestjs/common';
import {
	AuthorizableReferenceType,
	AuthorizationInjectionService,
	AuthorizationLoaderServiceGeneric,
} from '@src/modules/authorization';
import { SchoolExternalTool } from '../domain';
import { EntityId } from '@shared/domain/types';
import { SchoolExternalToolRepo } from '@shared/repo';

@Injectable()
export class SchoolExternalToolAuthorizableService implements AuthorizationLoaderServiceGeneric<SchoolExternalTool> {
	constructor(
		private readonly schoolExternalToolRepo: SchoolExternalToolRepo,
		injectionService: AuthorizationInjectionService
	) {
		injectionService.injectReferenceLoader(AuthorizableReferenceType.SchoolExternalToolEntity, this);
	}

	async findById(id: EntityId): Promise<SchoolExternalTool> {
		const schoolExternalTool = await this.schoolExternalToolRepo.findById(id);

		return schoolExternalTool;
	}
}
