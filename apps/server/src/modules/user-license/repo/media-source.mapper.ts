import { EntityData } from '@mikro-orm/core';
import { MediaSource } from '../domain';
import { MediaSourceEntity } from '../entity';

export class MediaSourceMapper {
	public static mapToEntityProperties(entityDO: MediaSource): EntityData<MediaSourceEntity> {
		const entityProps: EntityData<MediaSourceEntity> = {
			name: entityDO.name,
			sourceId: entityDO.sourceId,
		};

		return entityProps;
	}

	public static mapEntityToDo(entity: MediaSourceEntity): MediaSource {
		const domainObject = new MediaSource({
			id: entity.id,
			name: entity.name,
			sourceId: entity.sourceId,
		});

		return domainObject;
	}
}
