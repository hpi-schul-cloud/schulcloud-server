import { Injectable, NotImplementedException } from '@nestjs/common';
import { EntityId, LearnroomMetadata, LearnroomTypes } from '@shared/domain';
import { CourseRepo } from '@shared/repo';

type RepoType = CourseRepo;

@Injectable()
export class MetadataLoader {
	private repos: Map<LearnroomTypes, RepoType> = new Map();

	constructor(private readonly courseRepo: CourseRepo) {
		this.repos.set(LearnroomTypes.Course, this.courseRepo);
	}

	private resolveRepo(parentType: LearnroomTypes): RepoType {
		const repo: RepoType | undefined = this.repos.get(parentType);
		if (repo) {
			return repo;
		}
		throw new NotImplementedException('REPO_NOT_IMPLEMENTED');
	}

	async loadMetadata({ type, id }: { type: LearnroomTypes; id: EntityId }): Promise<LearnroomMetadata> {
		const repo = this.resolveRepo(type);

		const entity = await repo.findById(id);

		const metadata: LearnroomMetadata = entity.getMetadata();
		return metadata;
	}
}
