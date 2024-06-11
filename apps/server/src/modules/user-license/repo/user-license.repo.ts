import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { AnyUserLicense, MediaSource, MediaUserLicense } from '../domain';
import { MediaSourceEntity, MediaUserLicenseEntity, UserLicenseEntity, UserLicenseType } from '../entity';
import { UserLicenseQuery } from './user-license-query';
import { UserLicenseScope } from './user-license.scope';

@Injectable()
export class UserLicenseRepo {
	constructor(private readonly em: EntityManager) {}

	public async findMediaUserLicenses(query: UserLicenseQuery): Promise<MediaUserLicense[]> {
		const scope: UserLicenseScope = new UserLicenseScope();
		scope.byUserId(query.userId);
		scope.byType(UserLicenseType.MEDIA_LICENSE);
		scope.allowEmptyQuery(true);

		const entities: MediaUserLicenseEntity[] = await this.em.find<MediaUserLicenseEntity>(
			MediaUserLicenseEntity,
			scope.query,
			{
				populate: ['mediaSource'],
			}
		);

		const domainObjects: MediaUserLicense[] = entities.map((entity: MediaUserLicenseEntity) =>
			this.mapEntityToDomainObject(entity)
		);

		return domainObjects;
	}

	public async deleteUserLicense(license: AnyUserLicense): Promise<void> {
		const entity: UserLicenseEntity = this.mapDomainObjectToEntity(license);

		await this.em.removeAndFlush(entity);
	}

	public async saveUserLicense(license: AnyUserLicense): Promise<void> {
		const entity: UserLicenseEntity = this.mapDomainObjectToEntity(license);

		await this.em.persistAndFlush(entity);
	}

	private mapDomainObjectToEntity(domainObject: AnyUserLicense): UserLicenseEntity {
		const entity: MediaUserLicenseEntity = new MediaUserLicenseEntity({
			id: domainObject.id,
			user: this.em.getReference(User, domainObject.userId),
			type: UserLicenseType.MEDIA_LICENSE,
			mediumId: domainObject.mediumId,
			mediaSource: domainObject.mediaSource
				? new MediaSourceEntity({
						id: domainObject.mediaSource.id,
						name: domainObject.mediaSource.name,
						sourceId: domainObject.mediaSource.sourceId,
				  })
				: undefined,
		});

		return entity;
	}

	private mapEntityToDomainObject(entity: UserLicenseEntity): AnyUserLicense {
		if (entity.type === UserLicenseType.MEDIA_LICENSE && entity instanceof MediaUserLicenseEntity) {
			let mediaSource: MediaSource | undefined;

			if (entity.mediaSource) {
				mediaSource = new MediaSource({
					id: entity.mediaSource?.id,
					name: entity.mediaSource?.name,
					sourceId: entity.mediaSource?.sourceId,
				});
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
		throw new InternalServerErrorException(`Unknown entity type: ${entity.constructor.name}`);
	}
}
