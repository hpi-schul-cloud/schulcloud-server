import { EntityName, QueryOrderMap } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { IFindOptions, SortOrder } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { ReleaseEntity } from '../entity';

@Injectable()
export class ReleasesRepo extends BaseRepo<ReleaseEntity> {
	private static readonly DUPLICATE_KEY_ERROR_CODE = 11000;

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

	/**
	 * Inserts the release or updates the one with the same github id, unless it was already written by a newer refresh.
	 * The unique github id index prevents duplicates when concurrent refreshes insert the same release.
	 */
	public async upsertByGithubId(release: ReleaseEntity, syncedAt: Date): Promise<void> {
		const { githubId, name, body, url, author, authorUrl, createdAt, publishedAt, zipUrl, imageIds } = release;
		const collection = this._em.getCollection(this.entityName);
		const filter = { githubId, ...this.notSyncedAfter(syncedAt, true) };
		const update = {
			$set: { githubId, name, body, url, author, authorUrl, createdAt, publishedAt, zipUrl, imageIds, syncedAt },
		};

		try {
			await collection.updateOne(filter, update, { upsert: true });
		} catch (error) {
			if ((error as { code?: unknown }).code !== ReleasesRepo.DUPLICATE_KEY_ERROR_CODE) {
				throw error;
			}

			// the release exists but did not match: it is newer (skipped here) or was inserted concurrently (updated here)
			await collection.updateOne(filter, update);
		}
	}

	/** also removes legacy releases without a github id, but keeps releases written by a newer refresh */
	public async deleteAllExceptGithubIds(githubIdsToKeep: number[], syncedAt: Date): Promise<number> {
		const deletedCount = await this._em.nativeDelete(this.entityName, {
			githubId: { $nin: githubIdsToKeep },
			...this.notSyncedAfter(syncedAt, false),
		});

		return deletedCount;
	}

	private notSyncedAfter(
		syncedAt: Date,
		includeSame: boolean
	): { $or: [{ syncedAt: { $lte: Date } | { $lt: Date } }, { syncedAt: { $exists: false } }] } {
		const syncedBefore = includeSame ? { $lte: syncedAt } : { $lt: syncedAt };

		// releases stored before the field existed have no syncedAt
		return { $or: [{ syncedAt: syncedBefore }, { syncedAt: { $exists: false } }] };
	}

	public async findAllImageIds(): Promise<EntityId[]> {
		const releases = await this._em.find(this.entityName, {}, { fields: ['imageIds'] });
		const imageIds = [...new Set(releases.flatMap((release) => release.imageIds))];

		return imageIds;
	}
}
