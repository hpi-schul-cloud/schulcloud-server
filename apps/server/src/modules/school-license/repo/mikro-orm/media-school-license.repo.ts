import { EntityData, EntityName } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { EntityId } from '@shared/domain/types';
import { MediaSchoolLicense } from '../../domain';
import { MediaSchoolLicenseEntity } from '../../entity';
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

	protected mapDOToEntityProperties(entityDO: MediaSchoolLicense): EntityData<MediaSchoolLicenseEntity> {
		const entityProps: EntityData<MediaSchoolLicenseEntity> = MediaSchoolLicenseEntityMapper.mapDOToEntityProperties(
			entityDO,
			this.em
		);

		return entityProps;
	}

	public async deleteAllByMediaSource(mediaSourceId: EntityId): Promise<number> {
		const deleteCount = await this.em.nativeDelete(this.entityName, {
			mediaSource: new ObjectId(mediaSourceId),
		});

		return deleteCount;
	}

	public async deleteAllBySchoolAndMediaSource(schoolId: EntityId, mediaSourceId: EntityId): Promise<number> {
		const deleteCount = await this.em.nativeDelete(this.entityName, {
			school: new ObjectId(schoolId),
			mediaSource: new ObjectId(mediaSourceId),
		});

		return deleteCount;
	}
}
