import { EntityData, EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { SchoolEntity } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { MediaSourceEntity } from '@src/modules/mediasource/entity';
import { MediaSource } from '@src/modules/mediasource/domain';

import { MediaSourceConfigMapper } from '@src/modules/mediasource/repo';
import { MediaSchoolLicense } from '../domain';
import { MediaSchoolLicenseEntity } from '../entity';
import { SchoolLicenseType } from '../enum';

@Injectable()
export class MediaSchoolLicenseRepo extends BaseDomainObjectRepo<MediaSchoolLicense, MediaSchoolLicenseEntity> {
	protected get entityName(): EntityName<MediaSchoolLicenseEntity> {
		return MediaSchoolLicenseEntity.name;
	}

	public async findMediaSchoolLicense(schoolId: EntityId, mediumId: string): Promise<MediaSchoolLicense> {
		const entity: MediaSchoolLicenseEntity = await this.em.findOneOrFail(
			MediaSchoolLicenseEntity,
			{ school: schoolId, mediumId, type: SchoolLicenseType.MEDIA_LICENSE },
			{
				populate: ['mediaSource'],
			}
		);

		const domainObjects: MediaSchoolLicense = this.mapEntityToDomainObject(entity);

		return domainObjects;
	}

	public async findMediaSchoolLicensesByMediumId(mediumId: string): Promise<MediaSchoolLicense[]> {
		const entities: MediaSchoolLicenseEntity[] = await this.em.find(
			MediaSchoolLicenseEntity,
			{ mediumId, type: SchoolLicenseType.MEDIA_LICENSE },
			{ populate: ['mediaSource'] }
		);

		const domainObjects: MediaSchoolLicense[] = entities.map((entity: MediaSchoolLicenseEntity) =>
			this.mapEntityToDomainObject(entity)
		);

		return domainObjects;
	}

	private mapEntityToDomainObject(entity: MediaSchoolLicenseEntity): MediaSchoolLicense {
		const mediaSource = new MediaSource({
			id: entity.mediaSource.id,
			name: entity.mediaSource.name,
			sourceId: entity.mediaSource.sourceId,
			format: entity.mediaSource.format,
			oauthConfig: entity.mediaSource.oauthConfig
				? MediaSourceConfigMapper.mapOauthConfigToDo(entity.mediaSource.oauthConfig)
				: undefined,
			basicAuthConfig: entity.mediaSource.basicConfig
				? MediaSourceConfigMapper.mapBasicConfigToDo(entity.mediaSource.basicConfig)
				: undefined,
		});

		const schoolLicense: MediaSchoolLicense = new MediaSchoolLicense({
			id: entity.id,
			schoolId: entity.school.id,
			mediumId: entity.mediumId,
			mediaSource,
			type: entity.type,
		});

		return schoolLicense;
	}

	protected mapDOToEntityProperties(entityDO: MediaSchoolLicense): EntityData<MediaSchoolLicenseEntity> {
		const entityProps: EntityData<MediaSchoolLicenseEntity> = {
			school: this.em.getReference(SchoolEntity, entityDO.schoolId),
			type: SchoolLicenseType.MEDIA_LICENSE,
			mediumId: entityDO.mediumId,
			mediaSource: this.em.getReference(MediaSourceEntity, entityDO.mediaSource.id),
		};

		return entityProps;
	}
}
