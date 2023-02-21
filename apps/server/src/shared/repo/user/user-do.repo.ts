import { Injectable } from '@nestjs/common';
import { BaseDORepo } from '@shared/repo';
import { EntityId, IUserProperties, Role, School, System, User } from '@shared/domain';
import { EntityName, FilterQuery, Reference } from '@mikro-orm/core';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { EntityNotFoundError } from '@shared/common';

@Injectable()
export class UserDORepo extends BaseDORepo<UserDO, User, IUserProperties> {
	get entityName(): EntityName<User> {
		return User;
	}

	entityFactory(props: IUserProperties): User {
		return new User(props);
	}

	async findById(id: EntityId, populate = false): Promise<UserDO> {
		const userEntity: User = await this._em.findOneOrFail(this.entityName, id as FilterQuery<User>);

		if (populate) {
			await this._em.populate(userEntity, ['roles', 'school.systems', 'school.schoolYear']);
			await this.populateRoles(userEntity.roles.getItems());
		}

		return this.mapEntityToDO(userEntity);
	}

	async findByExternalIdOrFail(externalId: string, systemId: string): Promise<UserDO> {
		const userDo: UserDO | null = await this.findByExternalId(externalId, systemId);
		if (userDo) {
			return userDo;
		}
		throw new EntityNotFoundError('User');
	}

	async findByExternalId(externalId: string, systemId: string): Promise<UserDO | null> {
		const userEntitys: User[] = await this._em.find(User, { externalId }, { populate: ['school.systems'] });
		const userEntity: User | undefined = userEntitys.find((user: User): boolean => {
			const { systems } = user.school;
			return systems && !!systems.getItems().find((system: System): boolean => system.id === systemId);
		});

		const userDo: UserDO | null = userEntity ? this.mapEntityToDO(userEntity) : null;
		return userDo;
	}

	private async populateRoles(roles: Role[]): Promise<void> {
		for (let i = 0; i < roles.length; i += 1) {
			const role = roles[i];
			if (!role.roles.isInitialized(true)) {
				// eslint-disable-next-line no-await-in-loop
				await this._em.populate(role, ['roles']);
				// eslint-disable-next-line no-await-in-loop
				await this.populateRoles(role.roles.getItems());
			}
		}
	}

	protected mapEntityToDO(entity: User): UserDO {
		const user: UserDO = new UserDO({
			id: entity.id,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			email: entity.email,
			firstName: entity.firstName,
			lastName: entity.lastName,
			roleIds: [],
			schoolId: entity.school.id,
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

		if (entity.roles.isInitialized(true)) {
			user.roleIds = entity.roles.getItems().map((role: Role) => role.id);
		}

		return user;
	}

	protected mapDOToEntityProperties(entityDO: UserDO): IUserProperties {
		return {
			email: entityDO.email,
			firstName: entityDO.firstName,
			lastName: entityDO.lastName,
			school: Reference.createFromPK(School, entityDO.schoolId),
			roles: entityDO.roleIds.map((roleId) => Reference.createFromPK(Role, roleId)),
			ldapDn: entityDO.ldapDn,
			externalId: entityDO.externalId,
			language: entityDO.language,
			forcePasswordChange: entityDO.forcePasswordChange,
			preferences: entityDO.preferences,
			lastLoginSystemChange: entityDO.lastLoginSystemChange,
			outdatedSince: entityDO.outdatedSince,
			previousExternalId: entityDO.previousExternalId,
		};
	}
}
