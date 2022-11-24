import { Injectable, NotImplementedException } from '@nestjs/common';
import { EntityId, User } from '@shared/domain';
import {
	CourseGroupRepo,
	CourseRepo,
	LessonRepo,
	SchoolRepo,
	SubmissionRepo,
	TaskRepo,
	TeamsRepo,
	UserRepo,
} from '@shared/repo';
import { AllowedAuthorizationEntityType, AllowedEntity } from './interfaces';

type RepoType =
	| TaskRepo
	| CourseRepo
	| UserRepo
	| SchoolRepo
	| LessonRepo
	| TeamsRepo
	| CourseGroupRepo
	| SubmissionRepo;

interface IRepoLoader {
	repo: RepoType;
	populate?: boolean;
}

@Injectable()
export class ReferenceLoader {
	private repos: Map<AllowedAuthorizationEntityType, IRepoLoader> = new Map();

	constructor(
		private readonly userRepo: UserRepo,
		private readonly courseRepo: CourseRepo,
		private readonly courseGroupRepo: CourseGroupRepo,
		private readonly taskRepo: TaskRepo,
		private readonly schoolRepo: SchoolRepo,
		private readonly lessonRepo: LessonRepo,
		private readonly teamsRepo: TeamsRepo,
		private readonly submissionRepo: SubmissionRepo
	) {
		this.repos.set(AllowedAuthorizationEntityType.Task, { repo: this.taskRepo });
		this.repos.set(AllowedAuthorizationEntityType.Course, { repo: this.courseRepo });
		this.repos.set(AllowedAuthorizationEntityType.CourseGroup, { repo: this.courseGroupRepo });
		this.repos.set(AllowedAuthorizationEntityType.User, { repo: this.userRepo, populate: true });
		this.repos.set(AllowedAuthorizationEntityType.School, { repo: this.schoolRepo });
		this.repos.set(AllowedAuthorizationEntityType.Lesson, { repo: this.lessonRepo });
		this.repos.set(AllowedAuthorizationEntityType.Team, { repo: this.teamsRepo, populate: true });
		this.repos.set(AllowedAuthorizationEntityType.Submission, { repo: this.submissionRepo });
	}

	private resolveRepo(type: AllowedAuthorizationEntityType): IRepoLoader {
		const repo = this.repos.get(type);
		if (repo) {
			return repo;
		}
		throw new NotImplementedException('REPO_NOT_IMPLEMENT');
	}

	async loadEntity(entityName: AllowedAuthorizationEntityType, entityId: EntityId): Promise<AllowedEntity> {
		const repoLoader: IRepoLoader = this.resolveRepo(entityName);

		let entity: AllowedEntity;
		if (repoLoader.populate) {
			entity = await repoLoader.repo.findById(entityId, true);
		} else {
			entity = await repoLoader.repo.findById(entityId);
		}

		return entity;
	}

	async getUserWithPermissions(userId: EntityId): Promise<User> {
		const user = await this.userRepo.findById(userId, true);

		return user;
	}
}
