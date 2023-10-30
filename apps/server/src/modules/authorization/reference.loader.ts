import { Injectable, NotImplementedException } from '@nestjs/common';
import { AuthorizableObject } from '@shared/domain/domain-object';
import { BaseDO } from '@shared/domain/domainobject/base.do';
import { User } from '@shared/domain/entity/user.entity';
import { EntityId } from '@shared/domain/types/entity-id';
import { CourseRepo } from '@shared/repo/course/course.repo';
import { CourseGroupRepo } from '@shared/repo/coursegroup/coursegroup.repo';
import { LessonRepo } from '@shared/repo/lesson/lesson.repo';
import { LegacySchoolRepo } from '@shared/repo/school/legacy-school.repo';
import { SchoolExternalToolRepo } from '@shared/repo/schoolexternaltool/school-external-tool.repo';
import { SubmissionRepo } from '@shared/repo/submission/submission.repo';
import { TaskRepo } from '@shared/repo/task/task.repo';
import { TeamsRepo } from '@shared/repo/teams/teams.repo';
import { UserRepo } from '@shared/repo/user/user.repo';
import { BoardDoAuthorizableService } from '../board/service/board-do-authorizable.service';
import { ContextExternalToolAuthorizableService } from '../tool/context-external-tool/service/context-external-tool-authorizable.service';
import { AuthorizableReferenceType } from './types/allowed-authorization-object-type.enum';

// replace later with general "base" do-repo
type RepoType =
	| TaskRepo
	| CourseRepo
	| UserRepo
	| LegacySchoolRepo
	| LessonRepo
	| TeamsRepo
	| CourseGroupRepo
	| SubmissionRepo
	| SchoolExternalToolRepo
	| BoardDoAuthorizableService
	| ContextExternalToolAuthorizableService;

interface IRepoLoader {
	repo: RepoType;
	populate?: boolean;
}

@Injectable()
export class ReferenceLoader {
	private repos: Map<AuthorizableReferenceType, IRepoLoader> = new Map();

	constructor(
		private readonly userRepo: UserRepo,
		private readonly courseRepo: CourseRepo,
		private readonly courseGroupRepo: CourseGroupRepo,
		private readonly taskRepo: TaskRepo,
		private readonly schoolRepo: LegacySchoolRepo,
		private readonly lessonRepo: LessonRepo,
		private readonly teamsRepo: TeamsRepo,
		private readonly submissionRepo: SubmissionRepo,
		private readonly schoolExternalToolRepo: SchoolExternalToolRepo,
		private readonly boardNodeAuthorizableService: BoardDoAuthorizableService,
		private readonly contextExternalToolAuthorizableService: ContextExternalToolAuthorizableService
	) {
		this.repos.set(AuthorizableReferenceType.Task, { repo: this.taskRepo });
		this.repos.set(AuthorizableReferenceType.Course, { repo: this.courseRepo });
		this.repos.set(AuthorizableReferenceType.CourseGroup, { repo: this.courseGroupRepo });
		this.repos.set(AuthorizableReferenceType.User, { repo: this.userRepo, populate: true });
		this.repos.set(AuthorizableReferenceType.School, { repo: this.schoolRepo });
		this.repos.set(AuthorizableReferenceType.Lesson, { repo: this.lessonRepo });
		this.repos.set(AuthorizableReferenceType.Team, { repo: this.teamsRepo, populate: true });
		this.repos.set(AuthorizableReferenceType.Submission, { repo: this.submissionRepo });
		this.repos.set(AuthorizableReferenceType.SchoolExternalToolEntity, { repo: this.schoolExternalToolRepo });
		this.repos.set(AuthorizableReferenceType.BoardNode, { repo: this.boardNodeAuthorizableService });
		this.repos.set(AuthorizableReferenceType.ContextExternalToolEntity, {
			repo: this.contextExternalToolAuthorizableService,
		});
	}

	private resolveRepo(type: AuthorizableReferenceType): IRepoLoader {
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
		const repoLoader: IRepoLoader = this.resolveRepo(objectName);

		let object: AuthorizableObject | BaseDO;
		if (repoLoader.populate) {
			object = await repoLoader.repo.findById(objectId, true);
		} else {
			object = await repoLoader.repo.findById(objectId);
		}

		return object;
	}

	async getUserWithPermissions(userId: EntityId): Promise<User> {
		const user = await this.userRepo.findById(userId, true);

		return user;
	}
}
