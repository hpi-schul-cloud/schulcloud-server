import { EntityData, EntityName } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { MediaSource } from '@modules/media-source';
import { MediaSourceMapper } from '@modules/media-source/repo';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { MediaSchoolLicense } from '../../domain';
import { MediaSchoolLicenseEntity } from '../../entity';
import { SchoolLicenseType } from '../../enum';
import { MediaSchoolLicenseEntityMapper } from '../mapper/media-school-license.entity.mapper';
import { MediaSchoolLicenseRepo } from '../media-school-license-repo.interface';
import { MediaSchoolLicenseScope } from './media-school-license.scope';

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

	public async findMediaSchoolLicensesBySchoolId(schoolId: EntityId): Promise<MediaSchoolLicense[]> {
		const scope: MediaSchoolLicenseScope = new MediaSchoolLicenseScope();
		scope.bySchoolId(schoolId);
		scope.bySchoolLicenseType(SchoolLicenseType.MEDIA_LICENSE);

		const entities: MediaSchoolLicenseEntity[] = await this.em.find(MediaSchoolLicenseEntity, scope.query, {
			populate: ['mediaSource'],
		});

		const domainObjects: MediaSchoolLicense[] = entities.map((entity: MediaSchoolLicenseEntity) =>
			this.mapEntityToDomainObject(entity)
		);

		return domainObjects;
	}

	private mapEntityToDomainObject(entity: MediaSchoolLicenseEntity): MediaSchoolLicense {
		let mediaSource: MediaSource | undefined;

		if (entity.mediaSource) {
			mediaSource = MediaSourceMapper.mapEntityToDo(entity.mediaSource);
		}

		const mediaSchoolLicense: MediaSchoolLicense = new MediaSchoolLicense({
			id: entity.id,
			schoolId: entity.school.id,
			mediumId: entity.mediumId,
			mediaSource,
			type: entity.type,
		});

		return mediaSchoolLicense;
	}
}
