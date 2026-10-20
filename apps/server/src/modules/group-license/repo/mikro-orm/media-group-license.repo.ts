import { EntityData, EntityName } from '@mikro-orm/core';
import { GroupEntity } from '@modules/group/entity';
import { MediaSource } from '@modules/media-source';
import { MediaSourceEntity } from '@modules/media-source/entity';
import { MediaSourceMapper } from '@modules/media-source/repo';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { MediaGroupLicense } from '../../domain';
import { MediaGroupLicenseEntity } from '../../entity';
import { GroupLicenseType } from '../../enum';
import { MediaGroupLicenseRepo } from '../media-group-license-repo.interface';

@Injectable()
export class MediaGroupLicenseMikroOrmRepo
	extends BaseDomainObjectRepo<MediaGroupLicense, MediaGroupLicenseEntity>
	implements MediaGroupLicenseRepo
{
	protected get entityName(): EntityName<MediaGroupLicenseEntity> {
		return MediaGroupLicenseEntity;
	}

	private mapEntityToDomainObject(entity: MediaGroupLicenseEntity): MediaGroupLicense {
		let mediaSource: MediaSource | undefined;

		if (entity.mediaSource) {
			mediaSource = MediaSourceMapper.mapEntityToDo(entity.mediaSource);
		}

		const groupLicense: MediaGroupLicense = new MediaGroupLicense({
			id: entity.id,
			groupId: entity.group.id,
			mediumId: entity.mediumId,
			mediaSource,
			type: entity.type,
		});

		return groupLicense;
	}

	protected mapDOToEntityProperties(entityDO: MediaGroupLicense): EntityData<MediaGroupLicenseEntity> {
		const entityProps: EntityData<MediaGroupLicenseEntity> = {
			group: this.em.getReference(GroupEntity, entityDO.groupId),
			type: GroupLicenseType.MEDIA_LICENSE,
			mediumId: entityDO.mediumId,
			mediaSource: entityDO.mediaSource ? this.em.getReference(MediaSourceEntity, entityDO.mediaSource.id) : undefined,
		};

		return entityProps;
	}

	public async findMediaGroupLicensesByGroupIds(groupIds: EntityId[]): Promise<MediaGroupLicense[]> {
		if (!groupIds || groupIds.length === 0) {
			return [];
		}

		const entities: MediaGroupLicenseEntity[] = await this.em.find(
			MediaGroupLicenseEntity,
			{ group: { $in: groupIds }, type: GroupLicenseType.MEDIA_LICENSE },
			{
				populate: ['mediaSource'],
			}
		);

		return entities.map((entity: MediaGroupLicenseEntity) => this.mapEntityToDomainObject(entity));
	}

	public async findMediaGroupLicensesByGroupId(groupId: EntityId): Promise<MediaGroupLicense[]> {
		return await this.findMediaGroupLicensesByGroupIds([groupId]);
	}
}
