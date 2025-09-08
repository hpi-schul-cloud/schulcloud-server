import {
	AuthorizableReferenceType,
	AuthorizationInjectionService,
	AuthorizationLoaderServiceGeneric,
} from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { School } from '../do/school';
import { SchoolService } from './school.service';

@Injectable()
export class SchoolAuthorizableService implements AuthorizationLoaderServiceGeneric<School> {
	constructor(
		private readonly schoolService: SchoolService,
		private readonly injectionService: AuthorizationInjectionService
	) {
		this.injectionService.injectReferenceLoader(AuthorizableReferenceType.School, this);
	}

	public async findById(id: EntityId): Promise<School> {
		const school = await this.schoolService.getSchoolById(id);

		return school;
	}
}
