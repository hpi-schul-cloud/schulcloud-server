import { EntityData } from '@mikro-orm/core';
import { MediaSource } from '../domain';
import { MediaSourceEntity } from '../entity';
import { MediaSourceConfigMapper } from './media-source-config.mapper';

export class MediaSourceMapper {
	public static mapToEntityProperties(entityDO: MediaSource): EntityData<MediaSourceEntity> {
		const entityProps: EntityData<MediaSourceEntity> = {
			name: entityDO.name,
			sourceId: entityDO.sourceId,
			oauthConfig: entityDO.oauthConfig
				? MediaSourceConfigMapper.mapOauthConfigToEntity(entityDO.oauthConfig)
				: undefined,
			basicConfig: entityDO.basicAuthConfig
				? MediaSourceConfigMapper.mapBasicConfigToEntity(entityDO.basicAuthConfig)
				: undefined,
			format: entityDO.format,
		};

		return entityProps;
	}

	public static mapEntityToDo(entity: MediaSourceEntity): MediaSource {
		const domainObject = new MediaSource({
			id: entity.id,
			name: entity.name,
			sourceId: entity.sourceId,
			oauthConfig: entity.oauthConfig ? MediaSourceConfigMapper.mapOauthConfigToDo(entity.oauthConfig) : undefined,
			basicAuthConfig: entity.basicConfig ? MediaSourceConfigMapper.mapBasicConfigToDo(entity.basicConfig) : undefined,
			format: entity.format,
		});

		return domainObject;
	}
}
