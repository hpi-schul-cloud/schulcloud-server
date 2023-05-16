import { Injectable, NotImplementedException } from '@nestjs/common';
import { BaseDO, EntityId, User } from '@shared/domain';
import { AuthorizableObject } from '@shared/domain/domain-object';
import {
	CourseGroupRepo,
	CourseRepo,
	LessonRepo,
	SchoolExternalToolRepo,
	SchoolRepo,
	SubmissionRepo,
	TaskRepo,
	TeamsRepo,
	UserRepo,
} from '@shared/repo';
import { BoardNodeService } from '@src/modules/board';
import { AllowedAuthorizationObjectType } from './types';

// replace later with general "base" do-repo
type RepoType =
	| TaskRepo
	| CourseRepo
	| UserRepo
	| SchoolRepo
	| LessonRepo
	| TeamsRepo
	| CourseGroupRepo
	| SubmissionRepo
	| SchoolExternalToolRepo
	| BoardNodeService;

interface IRepoLoader {
	repo: RepoType;
	populate?: boolean;
}

@Injectable()
export class ReferenceLoader {
	private repos: Map<AllowedAuthorizationObjectType, IRepoLoader> = new Map();

	constructor(
		private readonly userRepo: UserRepo,
		private readonly courseRepo: CourseRepo,
		private readonly courseGroupRepo: CourseGroupRepo,
		private readonly taskRepo: TaskRepo,
		private readonly schoolRepo: SchoolRepo,
		private readonly lessonRepo: LessonRepo,
		private readonly teamsRepo: TeamsRepo,
		private readonly submissionRepo: SubmissionRepo,
		private readonly schoolExternalToolRepo: SchoolExternalToolRepo,
		private readonly boardNodeService: BoardNodeService
	) {
		this.repos.set(AllowedAuthorizationObjectType.Task, { repo: this.taskRepo });
		this.repos.set(AllowedAuthorizationObjectType.Course, { repo: this.courseRepo });
		this.repos.set(AllowedAuthorizationObjectType.CourseGroup, { repo: this.courseGroupRepo });
		this.repos.set(AllowedAuthorizationObjectType.User, { repo: this.userRepo, populate: true });
		this.repos.set(AllowedAuthorizationObjectType.School, { repo: this.schoolRepo });
		this.repos.set(AllowedAuthorizationObjectType.Lesson, { repo: this.lessonRepo });
		this.repos.set(AllowedAuthorizationObjectType.Team, { repo: this.teamsRepo, populate: true });
		this.repos.set(AllowedAuthorizationObjectType.Submission, { repo: this.submissionRepo });
		this.repos.set(AllowedAuthorizationObjectType.SchoolExternalTool, { repo: this.schoolExternalToolRepo });
		this.repos.set(AllowedAuthorizationObjectType.BoardNode, { repo: this.boardNodeService });
	}

	private resolveRepo(type: AllowedAuthorizationObjectType): IRepoLoader {
		const repo = this.repos.get(type);
		if (repo) {
			return repo;
		}
		throw new NotImplementedException('REPO_OR_SERVICE_NOT_IMPLEMENT');
	}

	async loadAuthorizableObject(
		objectName: AllowedAuthorizationObjectType,
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
