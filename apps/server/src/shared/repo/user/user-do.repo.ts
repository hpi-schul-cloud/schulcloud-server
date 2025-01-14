import { EntityData, EntityName, FilterQuery, QueryOrderMap } from '@mikro-orm/core';
import { MultipleUsersFoundLoggableException } from '@modules/oauth/loggable';
import { UserQuery } from '@modules/user/service/user-query.type';
import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import { Page, RoleReference } from '@shared/domain/domainobject';
import { UserSourceOptions } from '@shared/domain/domainobject/user-source-options.do';
import { SecondarySchoolReference, UserDO } from '@shared/domain/domainobject/user.do';
import { Role, SchoolEntity, User, UserSchoolEmbeddable } from '@shared/domain/entity';
import { UserSourceOptionsEntity } from '@shared/domain/entity/user-source-options-entity';
import { IFindOptions, Pagination, SortOrder, SortOrderMap } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { BaseDORepo, Scope } from '@shared/repo';
import { UserScope } from './user.scope';

@Injectable()
export class UserDORepo extends BaseDORepo<UserDO, User> {
	get entityName(): EntityName<User> {
		return User;
	}

	public async find(query: UserQuery, options?: IFindOptions<UserDO>): Promise<Page<UserDO>> {
		const pagination: Pagination = options?.pagination || {};
		const order: QueryOrderMap<User> = this.createQueryOrderMap(options?.order || {});
		const scope: Scope<User> = new UserScope()
			.bySchoolId(query.schoolId)
			.byTspUid(query.tspUid)
			.byRoleId(query.roleId)
			.withDiscoverableTrue(query.discoverable)
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

	public async findById(id: EntityId, populate = false): Promise<UserDO> {
		const userEntity: User = await this._em.findOneOrFail(this.entityName, id as FilterQuery<User>);

		if (populate) {
			await this._em.populate(userEntity, ['roles', 'school.systems', 'school.currentYear', 'secondarySchools.role']);
			await this.populateRoles(userEntity.roles.getItems());
		}

		return this.mapEntityToDO(userEntity);
	}

	public async findByIds(ids: string[], populate = false): Promise<UserDO[]> {
		const users = await this._em.find(User, { id: { $in: ids } });

		if (populate) {
			await Promise.all(
				users.map((user) =>
					this._em.populate(user, [
						'roles',
						'school.systems',
						'school.currentYear',
						'school.name',
						'secondarySchools.role',
					])
				)
			);
			await Promise.all(users.map((user) => this.populateRoles(user.roles.getItems())));
		}

		const userDOs = users.map((user) => this.mapEntityToDO(user));

		return userDOs;
	}

	public async findByIdOrNull(id: EntityId, populate = false): Promise<UserDO | null> {
		const user: User | null = await this._em.findOne(this.entityName, id as FilterQuery<User>);

		if (!user) {
			return null;
		}

		if (populate) {
			await this._em.populate(user, ['roles', 'school.systems', 'school.currentYear', 'secondarySchools.role']);
			await this.populateRoles(user.roles.getItems());
		}

		const domainObject: UserDO = this.mapEntityToDO(user);

		return domainObject;
	}

	public async findByExternalIdOrFail(externalId: string, systemId: string): Promise<UserDO> {
		const userDo: UserDO | null = await this.findByExternalId(externalId, systemId);
		if (userDo) {
			return userDo;
		}
		throw new EntityNotFoundError('User');
	}

	public async findByExternalId(externalId: string, systemId: string): Promise<UserDO | null> {
		const userEntitys: User[] = await this._em.find(User, { externalId }, { populate: ['school.systems'] });

		if (userEntitys.length > 1) {
			throw new MultipleUsersFoundLoggableException(externalId);
		}
		const userEntity: User | undefined = userEntitys.find((user: User): boolean => {
			const { systems } = user.school;
			return systems && !!systems.getItems().find((system): boolean => system.id === systemId);
		});

		const userDo: UserDO | null = userEntity ? this.mapEntityToDO(userEntity) : null;
		return userDo;
	}

	public async findByEmail(email: string): Promise<UserDO[]> {
		// find mail case-insensitive by regex
		const userEntitys: User[] = await this._em.find(User, {
			email: new RegExp(`^${email.replace(/\W/g, '\\$&')}$`, 'i'),
		});

		await this._em.populate(userEntitys, ['roles']);

		const userDos: UserDO[] = userEntitys.map((userEntity: User): UserDO => this.mapEntityToDO(userEntity));

		return userDos;
	}

	public mapEntityToDO(entity: User): UserDO {
		const user: UserDO = new UserDO({
			id: entity.id,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			email: entity.email,
			firstName: entity.firstName,
			lastName: entity.lastName,
			preferredName: entity.preferredName,
			roles: [],
			schoolId: entity.school.id,
			schoolName: entity.school.name,
			secondarySchools: [],
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
			birthday: entity.birthday,
			sourceOptions: entity.sourceOptions ? new UserSourceOptions({ tspUid: entity.sourceOptions.tspUid }) : undefined,
		});

		if (entity.roles.isInitialized()) {
			user.roles = entity.roles
				.getItems()
				.map((role: Role): RoleReference => new RoleReference({ id: role.id, name: role.name }));
		}

		if (entity.secondarySchools) {
			user.secondarySchools = entity.secondarySchools.map(
				(school) =>
					new SecondarySchoolReference({
						schoolId: school.school.id,
						role: new RoleReference({ id: school.role.id, name: school.role.name }),
					})
			);
		}

		return user;
	}

	public mapDOToEntityProperties(entityDO: UserDO): EntityData<User> {
		return {
			email: entityDO.email,
			firstName: entityDO.firstName,
			lastName: entityDO.lastName,
			preferredName: entityDO.preferredName,
			school: this._em.getReference(SchoolEntity, entityDO.schoolId),
			roles: entityDO.roles.map((roleRef: RoleReference) => this._em.getReference(Role, roleRef.id)),
			secondarySchools: entityDO.secondarySchools.map(
				(secondarySchool) =>
					new UserSchoolEmbeddable({
						school: this._em.getReference(SchoolEntity, secondarySchool.schoolId),
						role: this._em.getReference(Role, secondarySchool.role.id),
					})
			),
			ldapDn: entityDO.ldapDn,
			externalId: entityDO.externalId,
			language: entityDO.language,
			forcePasswordChange: entityDO.forcePasswordChange,
			preferences: entityDO.preferences,
			lastLoginSystemChange: entityDO.lastLoginSystemChange,
			outdatedSince: entityDO.outdatedSince,
			previousExternalId: entityDO.previousExternalId,
			birthday: entityDO.birthday,
			sourceOptions: entityDO.sourceOptions
				? new UserSourceOptionsEntity({ tspUid: entityDO.sourceOptions.tspUid })
				: undefined,
		};
	}

	public async findByTspUids(tspUids: string[]): Promise<UserDO[]> {
		const users = await this._em.find(
			User,
			{
				sourceOptions: { tspUid: { $in: tspUids } },
			},
			{
				populate: ['roles', 'school.systems', 'school.currentYear', 'school.name', 'secondarySchools.role'],
			}
		);

		const userDOs = users.map((user) => this.mapEntityToDO(user));

		return userDOs;
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
		for (const role of roles) {
			if (!role.roles.isInitialized(true)) {
				// eslint-disable-next-line no-await-in-loop
				await this._em.populate(role, ['roles']);
				// eslint-disable-next-line no-await-in-loop
				await this.populateRoles(role.roles.getItems());
			}
		}
	}
}
