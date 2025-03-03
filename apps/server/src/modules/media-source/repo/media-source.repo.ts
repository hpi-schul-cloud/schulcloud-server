import { EntityData, EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { MediaSource } from '../do';
import { MediaSourceEntity } from '../entity';
import { MediaSourceDataFormat } from '../enum';
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

	public async findByFormat(format: MediaSourceDataFormat): Promise<MediaSource | null> {
		const entity: MediaSourceEntity | null = await this.em.findOne(MediaSourceEntity, { format });

		if (!entity) {
			return null;
		}

		const domainObject: MediaSource = MediaSourceMapper.mapEntityToDo(entity);

		return domainObject;
	}

	public async findByFormatAndSourceId(format: MediaSourceDataFormat, sourceId: string): Promise<MediaSource | null> {
		const entity: MediaSourceEntity | null = await this.em.findOne(MediaSourceEntity, { format, sourceId });

		if (!entity) {
			return null;
		}

		const domainObject: MediaSource = MediaSourceMapper.mapEntityToDo(entity);

		return domainObject;
	}

	public async findAll(): Promise<MediaSource[]> {
		const entities: MediaSourceEntity[] = await this.em.find(MediaSourceEntity, {});

		const domainObjects: MediaSource[] = entities.map((entity) => MediaSourceMapper.mapEntityToDo(entity));

		return domainObjects;
	}
}
