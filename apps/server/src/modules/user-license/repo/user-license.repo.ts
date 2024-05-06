import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { AnyUserLicense, MediaUserLicense } from '../domain';
import { MediaUserLicenseEntity, UserLicenseEntity, UserLicenseType } from '../entity';
import { UserLicenseQuery } from './user-license-query';
import { UserLicenseScope } from './user-license.scope';

@Injectable()
export class UserLicenseRepo {
	constructor(private readonly em: EntityManager) {}

	public async findUserLicenses(query: UserLicenseQuery): Promise<AnyUserLicense[]> {
		const scope: UserLicenseScope = new UserLicenseScope();
		scope.byUserId(query.userId);
		scope.byType(query.type);
		scope.allowEmptyQuery(true);

		const entities: UserLicenseEntity[] = await this.em.find(UserLicenseEntity, scope.query);

		const domainObjects: AnyUserLicense[] = entities.map((entity: UserLicenseEntity) =>
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
			mediaSourceId: domainObject.mediaSourceId,
		});

		return entity;
	}

	private mapEntityToDomainObject(entity: UserLicenseEntity): AnyUserLicense {
		if (entity.type === UserLicenseType.MEDIA_LICENSE && entity instanceof MediaUserLicenseEntity) {
			const userLicense: MediaUserLicense = new MediaUserLicense({
				id: entity.id,
				userId: entity.user.id,
				mediumId: entity.mediumId,
				mediaSourceId: entity.mediaSourceId,
				type: entity.type,
			});

			return userLicense;
		}
		throw new InternalServerErrorException(`Unknown entity type: ${entity.constructor.name}`);
	}
}
