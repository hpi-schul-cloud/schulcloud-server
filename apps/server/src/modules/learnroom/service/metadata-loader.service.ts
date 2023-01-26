import { Injectable, NotImplementedException } from '@nestjs/common';
import { BaseMetadata, Course, EntityId, LearnroomTypes, Lesson } from '@shared/domain';
import { CourseRepo, LessonRepo } from '@shared/repo';

type RepoType = CourseRepo | LessonRepo;

@Injectable()
export class MetadataLoader {
	private repos: Map<LearnroomTypes, RepoType> = new Map();

	constructor(private readonly courseRepo: CourseRepo, private readonly lessonRepo: LessonRepo) {
		this.repos.set(LearnroomTypes.Course, this.courseRepo);
		this.repos.set(LearnroomTypes.Lesson, this.lessonRepo);
	}

	private resolveRepo(parentType: LearnroomTypes): RepoType {
		const repo: RepoType | undefined = this.repos.get(parentType);
		if (repo) {
			return repo;
		}
		throw new NotImplementedException('REPO_NOT_IMPLEMENTED');
	}

	async loadMetadata({ type, id }: { type: LearnroomTypes; id: EntityId }): Promise<BaseMetadata> {
		const repo = this.resolveRepo(type);

		const entity: Lesson | Course = await repo.findById(id);

		const metadata: BaseMetadata = entity.getMetadata();
		return metadata;
	}
}
