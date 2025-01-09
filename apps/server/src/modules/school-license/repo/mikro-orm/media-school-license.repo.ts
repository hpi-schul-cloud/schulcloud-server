import { EntityData, EntityName } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { EntityId } from '@shared/domain/types';
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

	public async findAllByMediaSourceAndMediumId(
		mediaSourceId: EntityId,
		mediumId: string
	): Promise<MediaSchoolLicense[]> {
		const entities: MediaSchoolLicenseEntity[] = await this.em.find(
			MediaSchoolLicenseEntity,
			{ type: SchoolLicenseType.MEDIA_LICENSE, mediaSource: new ObjectId(mediaSourceId), mediumId },
			{ populate: ['mediaSource', 'school'] }
		);

		const domainObjects: MediaSchoolLicense[] = entities.map((entity: MediaSchoolLicenseEntity) =>
			MediaSchoolLicenseEntityMapper.mapEntityToDO(entity)
		);

		return domainObjects;
	}

	protected mapDOToEntityProperties(entityDO: MediaSchoolLicense): EntityData<MediaSchoolLicenseEntity> {
		const entityProps: EntityData<MediaSchoolLicenseEntity> = MediaSchoolLicenseEntityMapper.mapDOToEntityProperties(
			entityDO,
			this.em
		);

		return entityProps;
	}
}
