import { Injectable, NotImplementedException } from '@nestjs/common';
import { Course, CourseGroup, EntityId, Lesson, School, Task, Team, User } from '@shared/domain';
import { CourseGroupRepo, CourseRepo, LessonRepo, SchoolRepo, TaskRepo, TeamsRepo, UserRepo } from '@shared/repo';
import { AllowedAuthorizationEntityType } from './interfaces';

type RepoType = TaskRepo | CourseRepo | UserRepo | SchoolRepo | LessonRepo | TeamsRepo | CourseGroupRepo;
export type ReferenceEntityType = Task | Course | User | School | Lesson | Team | CourseGroup;

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
		private readonly teamsRepo: TeamsRepo
	) {
		this.repos.set(AllowedAuthorizationEntityType.Task, { repo: this.taskRepo });
		this.repos.set(AllowedAuthorizationEntityType.Course, { repo: this.courseRepo });
		this.repos.set(AllowedAuthorizationEntityType.CourseGroup, { repo: this.courseGroupRepo });
		this.repos.set(AllowedAuthorizationEntityType.User, { repo: this.userRepo, populate: true });
		this.repos.set(AllowedAuthorizationEntityType.School, { repo: this.schoolRepo });
		this.repos.set(AllowedAuthorizationEntityType.Lesson, { repo: this.lessonRepo });
		this.repos.set(AllowedAuthorizationEntityType.Team, { repo: this.teamsRepo, populate: true });
	}

	private resolveRepo(type: AllowedAuthorizationEntityType): IRepoLoader {
		const repo: IRepoLoader | undefined = this.repos.get(type);
		if (repo) {
			return repo;
		}
		throw new NotImplementedException('REPO_NOT_IMPLEMENT');
	}

	async loadEntity(entityName: AllowedAuthorizationEntityType, entityId: EntityId): Promise<ReferenceEntityType> {
		const repoLoader: IRepoLoader = this.resolveRepo(entityName);

		let entity: ReferenceEntityType;
		if (repoLoader.populate) {
			entity = await repoLoader.repo.findById(entityId, true);
		} else {
			entity = await repoLoader.repo.findById(entityId);
		}

		return entity;
	}
}
