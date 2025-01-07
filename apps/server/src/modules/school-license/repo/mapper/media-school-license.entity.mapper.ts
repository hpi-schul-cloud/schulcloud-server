import { MediaSource } from '@modules/media-source';
import { MediaSourceEntity } from '@modules/media-source/entity';
import { MediaSourceMapper } from '@modules/media-source/repo';
import { SchoolEntity } from '@shared/domain/entity';
import { SchoolEntityMapper } from '@modules/school/repo/mikro-orm/mapper';
import { EntityData } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { MediaSchoolLicenseEntity } from '../../entity';
import { MediaSchoolLicense } from '../../domain';
import { SchoolLicenseType } from '../../enum';

export class MediaSchoolLicenseEntityMapper {
	public static mapEntityToDO(entity: MediaSchoolLicenseEntity): MediaSchoolLicense {
		let mediaSource: MediaSource | undefined;

		if (entity.mediaSource) {
			mediaSource = MediaSourceMapper.mapEntityToDo(entity.mediaSource);
		}

		const mediaSchoolLicense: MediaSchoolLicense = new MediaSchoolLicense({
			id: entity.id,
			school: SchoolEntityMapper.mapToDo(entity.school),
			mediumId: entity.mediumId,
			type: entity.type,
			mediaSource,
		});

		return mediaSchoolLicense;
	}

	public static mapDOToEntityProperties(
		entityDO: MediaSchoolLicense,
		em: EntityManager
	): EntityData<MediaSchoolLicenseEntity> {
		const entityProps: EntityData<MediaSchoolLicenseEntity> = {
			school: em.getReference(SchoolEntity, entityDO.school.id),
			type: SchoolLicenseType.MEDIA_LICENSE,
			mediumId: entityDO.mediumId,
			mediaSource: entityDO.mediaSource ? em.getReference(MediaSourceEntity, entityDO.mediaSource.id) : undefined,
		};

		return entityProps;
	}
}
