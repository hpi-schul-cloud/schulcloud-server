import {
	AuthorizableReferenceType,
	AuthorizationInjectionService,
	AuthorizationLoaderServiceGeneric,
} from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { SchoolExternalToolRepo } from '@shared/repo/schoolexternaltool';
import { SchoolExternalTool } from '../domain';

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
