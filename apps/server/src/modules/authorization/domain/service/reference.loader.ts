// TODO fix modules circular dependency
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { BoardNodeAuthorizableService } from '@modules/board/service';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { ContextExternalToolAuthorizableService } from '@modules/tool/context-external-tool/service';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { TeamAuthorisableService } from '@src/modules/teams/service/team-authorisable.service';
import { ExternalToolAuthorizableService } from '@modules/tool/external-tool/service';
import { LessonService } from '@modules/lesson';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { AuthorizableObject } from '@shared/domain/domain-object';
import { BaseDO } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import {
	CourseGroupRepo,
	CourseRepo,
	LegacySchoolRepo,
	SchoolExternalToolRepo,
	SubmissionRepo,
	TaskRepo,
	UserRepo,
} from '@shared/repo';
import { InstanceService } from '../../../instance';
import { AuthorizableReferenceType, AuthorizationLoaderService } from '../type';
import { AuthorizationInjectionService } from './authorization-injection.service';

@Injectable()
export class ReferenceLoader {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly courseRepo: CourseRepo,
		private readonly courseGroupRepo: CourseGroupRepo,
		private readonly taskRepo: TaskRepo,
		private readonly schoolRepo: LegacySchoolRepo,
		private readonly lessonService: LessonService,
		private readonly teamAuthorisableService: TeamAuthorisableService,
		private readonly submissionRepo: SubmissionRepo,
		private readonly schoolExternalToolRepo: SchoolExternalToolRepo,
		private readonly boardNodeAuthorizableService: BoardNodeAuthorizableService,
		private readonly contextExternalToolAuthorizableService: ContextExternalToolAuthorizableService,
		private readonly externalToolAuthorizableService: ExternalToolAuthorizableService,
		private readonly instanceService: InstanceService,
		private readonly authorizationInjectionService: AuthorizationInjectionService
	) {
		const service = this.authorizationInjectionService;
		service.injectReferenceLoader(AuthorizableReferenceType.Task, this.taskRepo);
		service.injectReferenceLoader(AuthorizableReferenceType.Course, this.courseRepo);
		service.injectReferenceLoader(AuthorizableReferenceType.CourseGroup, this.courseGroupRepo);
		service.injectReferenceLoader(AuthorizableReferenceType.User, this.userRepo);
		service.injectReferenceLoader(AuthorizableReferenceType.School, this.schoolRepo);
		service.injectReferenceLoader(AuthorizableReferenceType.Lesson, this.lessonService);
		service.injectReferenceLoader(AuthorizableReferenceType.Team, this.teamAuthorisableService);
		service.injectReferenceLoader(AuthorizableReferenceType.Submission, this.submissionRepo);
		service.injectReferenceLoader(AuthorizableReferenceType.SchoolExternalToolEntity, this.schoolExternalToolRepo);
		service.injectReferenceLoader(AuthorizableReferenceType.BoardNode, this.boardNodeAuthorizableService);
		service.injectReferenceLoader(
			AuthorizableReferenceType.ContextExternalToolEntity,
			this.contextExternalToolAuthorizableService
		);
		service.injectReferenceLoader(AuthorizableReferenceType.ExternalTool, this.externalToolAuthorizableService);
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
		const populate = this.authorizationInjectionService.getShouldPopulate(objectName);
		const referenceLoader: AuthorizationLoaderService = this.resolveLoader(objectName);
		const object = await referenceLoader.findById(objectId, populate);

		return object;
	}
}
