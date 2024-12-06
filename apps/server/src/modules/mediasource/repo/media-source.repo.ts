import { EntityData, EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { MediaSource } from '../domain';
import { MediaSourceEntity } from '../entity';
import { MediaSourceMapper } from './media-source.mapper';

@Injectable()
export class MediaSourceRepo extends BaseDomainObjectRepo<MediaSource, MediaSourceEntity> {
	protected get entityName(): EntityName<MediaSourceEntity> {
		return MediaSourceEntity;
	}

	protected mapDOToEntityProperties(entityDO: MediaSource): EntityData<MediaSourceEntity> {
		const entityProps: EntityData<MediaSourceEntity> = MediaSourceMapper.mapToEntityProperties(entityDO);

		return entityProps;
	}

	public async findBySourceId(sourceId: string): Promise<MediaSource | null> {
		const entity: MediaSourceEntity | null = await this.em.findOne(MediaSourceEntity, { sourceId });

		if (!entity) {
			return null;
		}

		const domainObject: MediaSource = MediaSourceMapper.mapEntityToDo(entity);

		return domainObject;
	}
}
