import {
	AuthorizableReferenceType,
	AuthorizationInjectionService,
	AuthorizationLoaderServiceGeneric,
} from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { CourseGroupEntity, CourseGroupRepo } from '../../repo';

@Injectable()
export class CourseGroupAuthorizableService implements AuthorizationLoaderServiceGeneric<CourseGroupEntity> {
	constructor(
		private readonly courseGroupRepo: CourseGroupRepo,
		private readonly injectionService: AuthorizationInjectionService
	) {
		this.injectionService.injectReferenceLoader(AuthorizableReferenceType.CourseGroup, this);
	}

	public async findById(id: EntityId): Promise<CourseGroupEntity> {
		const courseGroup = await this.courseGroupRepo.findById(id);

		return courseGroup;
	}
}
