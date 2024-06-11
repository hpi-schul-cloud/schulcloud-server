import { BoardDoAuthorizableService } from '@modules/board';

import { LessonService } from '@modules/lesson';
import { ContextExternalToolAuthorizableService } from '@modules/tool';
import { ExternalToolAuthorizableService } from '@modules/tool/external-tool/service';
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
	TeamsRepo,
	UserRepo,
} from '@shared/repo';
import { InstanceService } from '../../../instance';
import { AuthorizableReferenceType } from '../type';

type RepoType =
	| BoardDoAuthorizableService
	| ContextExternalToolAuthorizableService
	| CourseGroupRepo
	| CourseRepo
	| LegacySchoolRepo
	| LessonService
	| SchoolExternalToolRepo
	| SubmissionRepo
	| TaskRepo
	| TeamsRepo
	| UserRepo
	| ExternalToolAuthorizableService
	| InstanceService;

interface RepoLoader {
	repo: RepoType;
	populate?: boolean;
}

@Injectable()
export class ReferenceLoader {
	private repos: Map<AuthorizableReferenceType, RepoLoader> = new Map();

	constructor(
		private readonly userRepo: UserRepo,
		private readonly courseRepo: CourseRepo,
		private readonly courseGroupRepo: CourseGroupRepo,
		private readonly taskRepo: TaskRepo,
		private readonly schoolRepo: LegacySchoolRepo,
		private readonly lessonService: LessonService,
		private readonly teamsRepo: TeamsRepo,
		private readonly submissionRepo: SubmissionRepo,
		private readonly schoolExternalToolRepo: SchoolExternalToolRepo,
		private readonly boardNodeAuthorizableService: BoardDoAuthorizableService,
		private readonly contextExternalToolAuthorizableService: ContextExternalToolAuthorizableService,
		private readonly externalToolAuthorizableService: ExternalToolAuthorizableService,
		private readonly instanceService: InstanceService
	) {
		this.repos.set(AuthorizableReferenceType.Task, { repo: this.taskRepo });
		this.repos.set(AuthorizableReferenceType.Course, { repo: this.courseRepo });
		this.repos.set(AuthorizableReferenceType.CourseGroup, { repo: this.courseGroupRepo });
		this.repos.set(AuthorizableReferenceType.User, { repo: this.userRepo });
		this.repos.set(AuthorizableReferenceType.School, { repo: this.schoolRepo });
		this.repos.set(AuthorizableReferenceType.Lesson, { repo: this.lessonService });
		this.repos.set(AuthorizableReferenceType.Team, { repo: this.teamsRepo, populate: true });
		this.repos.set(AuthorizableReferenceType.Submission, { repo: this.submissionRepo });
		this.repos.set(AuthorizableReferenceType.SchoolExternalToolEntity, { repo: this.schoolExternalToolRepo });
		this.repos.set(AuthorizableReferenceType.BoardNode, { repo: this.boardNodeAuthorizableService });
		this.repos.set(AuthorizableReferenceType.ContextExternalToolEntity, {
			repo: this.contextExternalToolAuthorizableService,
		});
		this.repos.set(AuthorizableReferenceType.ExternalTool, { repo: this.externalToolAuthorizableService });
		this.repos.set(AuthorizableReferenceType.Instance, { repo: this.instanceService });
	}

	private resolveRepo(type: AuthorizableReferenceType): RepoLoader {
		const repo = this.repos.get(type);
		if (repo) {
			return repo;
		}
		throw new NotImplementedException('REPO_OR_SERVICE_NOT_IMPLEMENT');
	}

	async loadAuthorizableObject(
		objectName: AuthorizableReferenceType,
		objectId: EntityId
	): Promise<AuthorizableObject | BaseDO> {
		const repoLoader: RepoLoader = this.resolveRepo(objectName);

		let object: AuthorizableObject | BaseDO;
		if (repoLoader.populate) {
			object = await repoLoader.repo.findById(objectId, true);
		} else {
			object = await repoLoader.repo.findById(objectId);
		}

		return object;
	}
}
