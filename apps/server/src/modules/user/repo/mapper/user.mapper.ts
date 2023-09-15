import { ObjectId } from '@mikro-orm/mongodb';
import { User as UserEntity } from '@shared/domain';
import { User } from '../../domain';

export class UserMapper {
	static mapToDO(entity: UserEntity): User {
		return new User({
			id: entity.id,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			email: entity.email,
			firstName: entity.firstName,
			lastName: entity.lastName,
			roles: entity.roles.map((role) => role.id),
			school: SchoolMapper.mapToDO(entity.school),
			ldapDn: entity.ldapDn,
			externalId: entity.externalId,
			importHash: entity.importHash,
			firstNameSearchValues: entity.firstNameSearchValues,
			lastNameSearchValues: entity.lastNameSearchValues,
			emailSearchValues: entity.emailSearchValues,
			language: entity.language,
			forcePasswordChange: entity.forcePasswordChange,
			preferences: entity.preferences,
			lastLoginSystemChange: entity.lastLoginSystemChange,
			outdatedSince: entity.outdatedSince,
			previousExternalId: entity.previousExternalId,
		});
	}

	static mapToEntity(domainObject: User): UserEntity {
		return new UserEntity({
			email: domainObject.email,
			firstName: domainObject.firstName,
			lastName: domainObject.lastName,
			school: new ObjectId(domainObject.school),
			roles: domainObject.roles.map((roleId) => new ObjectId(roleId)),
			ldapDn: domainObject.ldapDn,
			externalId: domainObject.externalId,
			language: domainObject.language,
			forcePasswordChange: domainObject.forcePasswordChange,
			preferences: domainObject.preferences,
			lastLoginSystemChange: domainObject.lastLoginSystemChange,
			outdatedSince: domainObject.outdatedSince,
			previousExternalId: domainObject.previousExternalId,
		});
	}

	static mapToDOs(entities: UserEntity[]): User[] {
		return entities.map((entity) => this.mapToDO(entity));
	}

	static mapToEntities(domainObjects: User[]): UserEntity[] {
		return domainObjects.map((domainObject) => this.mapToEntity(domainObject));
	}
}
