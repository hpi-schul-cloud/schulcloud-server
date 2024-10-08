import { EntityData } from '@mikro-orm/core';
import { MediaSource } from '../domain';
import { MediaSourceEntity } from '../entity';
import { MediaSourceConfigMapper } from './media-source-config.mapper';

export class MediaSourceMapper {
	public static mapToEntityProperties(entityDO: MediaSource): EntityData<MediaSourceEntity> {
		const entityProps: EntityData<MediaSourceEntity> = {
			name: entityDO.name,
			sourceId: entityDO.sourceId,
			config: entityDO.config ? MediaSourceConfigMapper.mapToEntity(entityDO.config) : undefined,
			format: entityDO.format,
		};

		return entityProps;
	}

	public static mapEntityToDo(entity: MediaSourceEntity): MediaSource {
		const domainObject = new MediaSource({
			id: entity.id,
			name: entity.name,
			sourceId: entity.sourceId,
			config: entity.config ? MediaSourceConfigMapper.mapToDo(entity.config) : undefined,
			format: entity.format,
		});

		return domainObject;
	}
}
