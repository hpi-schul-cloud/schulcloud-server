import { EntityData } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { MediaSource } from '@modules/media-source';
import { MediaSourceEntity } from '@modules/media-source/entity';
import { MediaSourceMapper } from '@modules/media-source/repo';
import { SchoolEntity } from '@modules/school/repo';
import { MediaSchoolLicense } from '../../domain';
import { MediaSchoolLicenseEntity } from '../../entity';
import { SchoolLicenseType } from '../../enum';

export class MediaSchoolLicenseEntityMapper {
	public static mapEntityToDO(entity: MediaSchoolLicenseEntity): MediaSchoolLicense {
		let mediaSource: MediaSource | undefined;

		if (entity.mediaSource) {
			mediaSource = MediaSourceMapper.mapEntityToDo(entity.mediaSource);
		}

		const mediaSchoolLicense: MediaSchoolLicense = new MediaSchoolLicense({
			id: entity.id,
			schoolId: entity.school.id,
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
			school: em.getReference(SchoolEntity, entityDO.schoolId),
			type: SchoolLicenseType.MEDIA_LICENSE,
			mediumId: entityDO.mediumId,
			mediaSource: entityDO.mediaSource ? em.getReference(MediaSourceEntity, entityDO.mediaSource.id) : undefined,
		};

		return entityProps;
	}
}
