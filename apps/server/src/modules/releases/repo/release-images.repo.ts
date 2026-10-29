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

	/** returns only the id of an existing image, without loading the binary data */
	public async findImageIdBySourceUrl(sourceUrl: string): Promise<EntityId | null> {
		const image = await this._em.findOne(ReleaseImageEntity, { sourceUrl }, { fields: ['id'] });
		const imageId = image ? image.id : null;

		return imageId;
	}

	public async deleteAllExcept(idsToKeep: EntityId[]): Promise<number> {
		const deletedCount = await this._em.nativeDelete(this.entityName, { id: { $nin: idsToKeep } });

		return deletedCount;
	}
}
