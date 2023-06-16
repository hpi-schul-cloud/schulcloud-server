import { EntityName, FilterQuery, QueryOrderMap } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import {
	EntityId,
	IFindOptions,
	IPagination,
	IUserProperties,
	Role,
	School,
	SortOrder,
	SortOrderMap,
	System,
	User,
} from '@shared/domain';
import { Page } from '@shared/domain/domainobject/page';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { BaseDORepo, Scope } from '@shared/repo';
import { UserQuery } from '@src/modules/user/service/user-query.type';
import { UserScope } from './user.scope';

@Injectable()
export class UserDORepo extends BaseDORepo<UserDO, User, IUserProperties> {
	get entityName(): EntityName<User> {
		return User;
	}

	entityFactory(props: IUserProperties): User {
		return new User(props);
	}

	async find(query: UserQuery, options?: IFindOptions<UserDO>) {
		const pagination: IPagination = options?.pagination || {};
		const order: QueryOrderMap<User> = this.createQueryOrderMap(options?.order || {});
		const scope: Scope<User> = new UserScope()
			.bySchoolId(query.schoolId)
			.isOutdated(query.isOutdated)
			.whereLastLoginSystemChangeSmallerThan(query.lastLoginSystemChangeSmallerThan)
			.whereLastLoginSystemChangeIsBetween(
				query.lastLoginSystemChangeBetweenStart,
				query.lastLoginSystemChangeBetweenEnd
			)
			.withOutdatedSince(query.outdatedSince)
			.allowEmptyQuery(true);

		order._id = order._id ?? SortOrder.asc;

		const [entities, total]: [User[], number] = await this._em.findAndCount(User, scope.query, {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order,
		});

		const entityDos: UserDO[] = entities.map((entity) => this.mapEntityToDO(entity));
		const page: Page<UserDO> = new Page<UserDO>(entityDos, total);
		return page;
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

	mapEntityToDO(entity: User): UserDO {
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

		if (entity.roles.isInitialized()) {
			user.roleIds = entity.roles.getItems().map((role: Role): EntityId => role.id);
		}

		return user;
	}

	mapDOToEntityProperties(entityDO: UserDO): IUserProperties {
		return {
			email: entityDO.email,
			firstName: entityDO.firstName,
			lastName: entityDO.lastName,
			school: this._em.getReference(School, entityDO.schoolId),
			roles: entityDO.roleIds.map((roleId: EntityId) => this._em.getReference(Role, roleId)),
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

	private createQueryOrderMap(sort: SortOrderMap<User>): QueryOrderMap<User> {
		const queryOrderMap: QueryOrderMap<User> = {
			_id: sort.id,
		};
		Object.keys(queryOrderMap)
			.filter((key) => queryOrderMap[key] === undefined)
			.forEach((key) => delete queryOrderMap[key]);
		return queryOrderMap;
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
}
