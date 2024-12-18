import { EntityData, EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { SchoolEntity } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { MediaSource } from '@src/modules/media-source/domain';
import { MediaSourceEntity } from '@src/modules/media-source/entity';
import { MediaSourceConfigMapper } from '@src/modules/media-source/repo';
import { MediaSchoolLicense } from '../domain';
import { MediaSchoolLicenseEntity } from '../entity';
import { SchoolLicenseType } from '../enum';

@Injectable()
export class MediaSchoolLicenseRepo extends BaseDomainObjectRepo<MediaSchoolLicense, MediaSchoolLicenseEntity> {
	protected get entityName(): EntityName<MediaSchoolLicenseEntity> {
		return MediaSchoolLicenseEntity;
	}

	// TODO: remove redundant
	public async findMediaSchoolLicense(schoolId: EntityId, mediumId: string): Promise<MediaSchoolLicense | null> {
		const entity: MediaSchoolLicenseEntity | null = await this.em.findOne(
			MediaSchoolLicenseEntity,
			{ school: schoolId, mediumId, type: SchoolLicenseType.MEDIA_LICENSE },
			{
				populate: ['mediaSource'],
			}
		);

		if (!entity) {
			return null;
		}

		const domainObject: MediaSchoolLicense = this.mapEntityToDomainObject(entity);

		return domainObject;
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
		let mediaSource: MediaSource | undefined;

		if (entity.mediaSource) {
			mediaSource = new MediaSource({
				id: entity.mediaSource.id,
				name: entity.mediaSource.name,
				sourceId: entity.mediaSource.sourceId,
				format: entity.mediaSource.format,
				oauthConfig: entity.mediaSource.oauthConfig
					? MediaSourceConfigMapper.mapOauthConfigToDo(entity.mediaSource.oauthConfig)
					: undefined,
				basicAuthConfig: entity.mediaSource.basicAuthConfig
					? MediaSourceConfigMapper.mapBasicConfigToDo(entity.mediaSource.basicAuthConfig)
					: undefined,
			});
		}

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
			mediaSource: entityDO.mediaSource ? this.em.getReference(MediaSourceEntity, entityDO.mediaSource.id) : undefined,
		};

		return entityProps;
	}
}
