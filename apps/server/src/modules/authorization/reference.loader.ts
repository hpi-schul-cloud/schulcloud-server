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
import { AuthorizableReferenceType } from './types';
import { ContextExternalToolService } from '../tool/service';

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
	| BoardNodeService
	| ContextExternalToolService;

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
		private readonly schoolRepo: SchoolRepo,
		private readonly lessonRepo: LessonRepo,
		private readonly teamsRepo: TeamsRepo,
		private readonly submissionRepo: SubmissionRepo,
		private readonly schoolExternalToolRepo: SchoolExternalToolRepo,
		private readonly boardNodeService: BoardNodeService,
		private readonly contextExternalToolService: ContextExternalToolService
	) {
		this.repos.set(AuthorizableReferenceType.Task, { repo: this.taskRepo });
		this.repos.set(AuthorizableReferenceType.Course, { repo: this.courseRepo });
		this.repos.set(AuthorizableReferenceType.CourseGroup, { repo: this.courseGroupRepo });
		this.repos.set(AuthorizableReferenceType.User, { repo: this.userRepo, populate: true });
		this.repos.set(AuthorizableReferenceType.School, { repo: this.schoolRepo });
		this.repos.set(AuthorizableReferenceType.Lesson, { repo: this.lessonRepo });
		this.repos.set(AuthorizableReferenceType.Team, { repo: this.teamsRepo, populate: true });
		this.repos.set(AuthorizableReferenceType.Submission, { repo: this.submissionRepo });
		this.repos.set(AuthorizableReferenceType.SchoolExternalTool, { repo: this.schoolExternalToolRepo });
		this.repos.set(AuthorizableReferenceType.BoardNode, { repo: this.boardNodeService });
		this.repos.set(AuthorizableReferenceType.ContextExternalTool, { repo: this.contextExternalToolService });
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
