import { EntityName, QueryOrderMap } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { IFindOptions, SortOrder } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { ReleaseEntity } from '../entity';

@Injectable()
export class ReleasesRepo extends BaseRepo<ReleaseEntity> {
	get entityName(): EntityName<ReleaseEntity> {
		return ReleaseEntity;
	}

	public async findReleases(options?: IFindOptions<ReleaseEntity>): Promise<Counted<ReleaseEntity[]>> {
		const { pagination, order } = options || {};
		const orderBy = { publishedAt: SortOrder.desc, ...order } as QueryOrderMap<ReleaseEntity>;

		const [releases, count] = await this._em.findAndCount(
			this.entityName,
			{},
			{
				offset: pagination?.skip,
				limit: pagination?.limit,
				orderBy,
			}
		);

		return [releases, count];
	}

	/** inserts the release or updates the one with the same github id, so concurrent fetches cannot create duplicates */
	public async upsertByGithubId(release: ReleaseEntity): Promise<void> {
		const { githubId, name, body, url, author, authorUrl, createdAt, publishedAt, zipUrl, imageIds } = release;

		await this._em.upsert(
			ReleaseEntity,
			{ githubId, name, body, url, author, authorUrl, createdAt, publishedAt, zipUrl, imageIds },
			{ onConflictFields: ['githubId'] }
		);
	}

	/** also removes legacy releases without a github id */
	public async deleteAllExceptGithubIds(githubIdsToKeep: number[]): Promise<number> {
		const deletedCount = await this._em.nativeDelete(this.entityName, { githubId: { $nin: githubIdsToKeep } });

		return deletedCount;
	}

	public async findAllImageIds(): Promise<EntityId[]> {
		const releases = await this._em.find(this.entityName, {}, { fields: ['imageIds'] });
		const imageIds = [...new Set(releases.flatMap((release) => release.imageIds))];

		return imageIds;
	}
}
