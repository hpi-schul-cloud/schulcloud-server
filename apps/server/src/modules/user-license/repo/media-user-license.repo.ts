import { EntityData, EntityName } from '@mikro-orm/core';
import { MediaSource } from '@modules/media-source';
import { MediaSourceEntity } from '@modules/media-source/entity';
import { MediaSourceMapper } from '@modules/media-source/repo';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { MediaUserLicense } from '../domain';
import { MediaUserLicenseEntity, UserLicenseType } from '../entity';

@Injectable()
export class MediaUserLicenseRepo extends BaseDomainObjectRepo<MediaUserLicense, MediaUserLicenseEntity> {
	protected get entityName(): EntityName<MediaUserLicenseEntity> {
		return MediaUserLicenseEntity;
	}

	private mapEntityToDomainObject(entity: MediaUserLicenseEntity): MediaUserLicense {
		let mediaSource: MediaSource | undefined;

		if (entity.mediaSource) {
			mediaSource = MediaSourceMapper.mapEntityToDo(entity.mediaSource);
		}

		const userLicense: MediaUserLicense = new MediaUserLicense({
			id: entity.id,
			userId: entity.user.id,
			mediumId: entity.mediumId,
			mediaSource,
			type: entity.type,
		});

		return userLicense;
	}

	protected mapDOToEntityProperties(entityDO: MediaUserLicense): EntityData<MediaUserLicenseEntity> {
		const entityProps: EntityData<MediaUserLicenseEntity> = {
			user: this.em.getReference(User, entityDO.userId),
			type: UserLicenseType.MEDIA_LICENSE,
			mediumId: entityDO.mediumId,
			mediaSource: entityDO.mediaSource ? this.em.getReference(MediaSourceEntity, entityDO.mediaSource.id) : undefined,
		};

		return entityProps;
	}

	public async findMediaUserLicensesForUser(userId: EntityId): Promise<MediaUserLicense[]> {
		const entities: MediaUserLicenseEntity[] = await this.em.find(
			MediaUserLicenseEntity,
			{ user: userId, type: UserLicenseType.MEDIA_LICENSE },
			{
				populate: ['mediaSource'],
			}
		);

		const domainObjects: MediaUserLicense[] = entities.map((entity: MediaUserLicenseEntity) =>
			this.mapEntityToDomainObject(entity)
		);

		return domainObjects;
	}
}
