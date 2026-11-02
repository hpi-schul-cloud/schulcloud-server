import { EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { ReleaseImageEntity } from '../entity';

@Injectable()
export class ReleaseImagesRepo extends BaseRepo<ReleaseImageEntity> {
	get entityName(): EntityName<ReleaseImageEntity> {
		return ReleaseImageEntity;
	}

	public async findImageById(id: EntityId): Promise<ReleaseImageEntity> {
		const image = await this._em.findOneOrFail(ReleaseImageEntity, id);

		return image;
	}

	/**
	 * Refreshes lastUsedAt of an existing image and returns its id (without loading the binary data), or null if there is none.
	 * The update happens first, so a concurrent cleanup either deleted the image already or will skip it.
	 */
	public async markImageUsed(sourceUrl: string, usedAt = new Date()): Promise<EntityId | null> {
		const updatedCount = await this._em.nativeUpdate(this.entityName, { sourceUrl }, { lastUsedAt: usedAt });
		if (updatedCount === 0) {
			return null;
		}

		const image = await this._em.findOne(this.entityName, { sourceUrl }, { fields: ['id'] });
		const imageId = image ? image.id : null;

		return imageId;
	}

	public async deleteUnusedImages(idsToKeep: EntityId[], unusedSince: Date): Promise<number> {
		const deletedCount = await this._em.nativeDelete(this.entityName, {
			id: { $nin: idsToKeep },
			lastUsedAt: { $lt: unusedSince },
		});

		return deletedCount;
	}
}
