// TODO fix modules circular dependency
import {
	AuthorizableReferenceType,
	AuthorizationInjectionService,
	AuthorizationLoaderService,
} from '@modules/authorization';
import { InstanceService } from '@modules/instance';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { AuthorizableObject } from '@shared/domain/domain-object';
import { BaseDO } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { CourseRepo } from '@shared/repo/course';
import { CourseGroupRepo } from '@shared/repo/coursegroup';
import { LegacySchoolRepo } from '@shared/repo/school';
import { SubmissionRepo } from '@shared/repo/submission';
import { TaskRepo } from '@shared/repo/task';
import { UserRepo } from '@shared/repo/user';

@Injectable()
export class ReferenceLoader {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly courseRepo: CourseRepo,
		private readonly courseGroupRepo: CourseGroupRepo,
		private readonly taskRepo: TaskRepo,
		private readonly schoolRepo: LegacySchoolRepo,
		private readonly submissionRepo: SubmissionRepo,
		private readonly instanceService: InstanceService,
		private readonly authorizationInjectionService: AuthorizationInjectionService
	) {
		const service = this.authorizationInjectionService;
		service.injectReferenceLoader(AuthorizableReferenceType.Task, this.taskRepo);
		service.injectReferenceLoader(AuthorizableReferenceType.Course, this.courseRepo);
		service.injectReferenceLoader(AuthorizableReferenceType.CourseGroup, this.courseGroupRepo);
		service.injectReferenceLoader(AuthorizableReferenceType.User, this.userRepo);
		service.injectReferenceLoader(AuthorizableReferenceType.School, this.schoolRepo);
		service.injectReferenceLoader(AuthorizableReferenceType.Submission, this.submissionRepo);
		service.injectReferenceLoader(AuthorizableReferenceType.Instance, this.instanceService);
	}

	private resolveLoader(type: AuthorizableReferenceType): AuthorizationLoaderService {
		const repo = this.authorizationInjectionService.getReferenceLoader(type);
		if (repo) {
			return repo;
		}
		throw new NotImplementedException('REPO_OR_SERVICE_NOT_IMPLEMENT');
	}

	async loadAuthorizableObject(
		objectName: AuthorizableReferenceType,
		objectId: EntityId
	): Promise<AuthorizableObject | BaseDO> {
		const referenceLoader: AuthorizationLoaderService = this.resolveLoader(objectName);
		const object = await referenceLoader.findById(objectId);

		return object;
	}
}
