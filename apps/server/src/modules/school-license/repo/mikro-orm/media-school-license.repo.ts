import { EntityData, EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { MediaSchoolLicense } from '../../domain';
import { MediaSchoolLicenseEntity } from '../../entity';
import { SchoolLicenseType } from '../../enum';
import { MediaSchoolLicenseEntityMapper } from '../mapper/media-school-license.entity.mapper';
import { MediaSchoolLicenseRepo } from '../media-school-license-repo.interface';

@Injectable()
export class MediaSchoolLicenseMikroOrmRepo
	extends BaseDomainObjectRepo<MediaSchoolLicense, MediaSchoolLicenseEntity>
	implements MediaSchoolLicenseRepo
{
	protected get entityName(): EntityName<MediaSchoolLicenseEntity> {
		return MediaSchoolLicenseEntity;
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
		const schoolLicense: MediaSchoolLicense = MediaSchoolLicenseEntityMapper.mapEntityToDO(entity);

		return schoolLicense;
	}

	protected mapDOToEntityProperties(entityDO: MediaSchoolLicense): EntityData<MediaSchoolLicenseEntity> {
		const entityProps: EntityData<MediaSchoolLicenseEntity> = MediaSchoolLicenseEntityMapper.mapDOToEntityProperties(
			entityDO,
			this.em
		);

		return entityProps;
	}

	public async findMediaSchoolLicensesBySchoolId(schoolId: string): Promise<MediaSchoolLicense[]> {
		const entities: MediaSchoolLicenseEntity[] = await this.em.find(
			MediaSchoolLicenseEntity,
			{ school: schoolId, type: SchoolLicenseType.MEDIA_LICENSE },
			{ populate: ['mediaSource'] }
		);

		const domainObjects: MediaSchoolLicense[] = entities.map((entity: MediaSchoolLicenseEntity) =>
			this.mapEntityToDomainObject(entity)
		);

		return domainObjects;
	}
}
