import { Injectable } from '@nestjs/common';
import { BaseDORepo, EntityProperties } from '@shared/repo/index';
import { EntityId, IUserProperties, Role, School, User } from '@shared/domain/index';
import { EntityName, FilterQuery, Reference } from '@mikro-orm/core';
import { UserDO } from '@shared/domain/domainobject/user.do';

@Injectable()
export class UserDORepo extends BaseDORepo<UserDO, User, IUserProperties> {
	get entityName(): EntityName<User> {
		return User;
	}

	getConstructor(): { new (I): User } {
		return User;
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
		const userEntitys: User[] = await this._em.find(User, { externalId }, { populate: ['school.systems'] });
		const userEntity: User | undefined = userEntitys.find((user: User) => {
			const { systems } = user.school;
			return systems && systems.getItems().find((system) => system.id === systemId);
		});
		return userEntity ? this.mapEntityToDO(userEntity) : Promise.reject();
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
		return new UserDO({
			email: entity.email,
			firstName: entity.firstName,
			lastName: entity.lastName,
			roleIds: entity.roles.getItems().map((role: Role) => role.id),
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
		});
	}

	protected mapDOToEntity(entityDO: UserDO): EntityProperties<IUserProperties> {
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
		};
	}
}
