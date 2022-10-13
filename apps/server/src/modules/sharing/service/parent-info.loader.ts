import { Injectable, NotImplementedException } from '@nestjs/common';
import { ShareTokenParentType, ShareTokenPayload } from '@shared/domain';
import { CourseRepo } from '@shared/repo';

type RepoType = CourseRepo;

interface ParentInfo {
	name: string;
}

@Injectable()
export class ParentInfoLoader {
	private repos: Map<ShareTokenParentType, RepoType> = new Map();

	constructor(private readonly courseRepo: CourseRepo) {
		this.repos.set(ShareTokenParentType.Course, this.courseRepo);
	}

	private resolveRepo(parentType: ShareTokenParentType): RepoType {
		const repo: RepoType | undefined = this.repos.get(parentType);
		if (repo) {
			return repo;
		}
		throw new NotImplementedException('REPO_NOT_IMPLEMENTED');
	}

	async loadParentInfo(payload: ShareTokenPayload): Promise<ParentInfo> {
		const { parentType, parentId } = payload;
		const repo = this.resolveRepo(parentType);

		const entity = await repo.findById(parentId);

		const parentInfo: ParentInfo = {
			name: entity.name,
		};
		return parentInfo;
	}
}
