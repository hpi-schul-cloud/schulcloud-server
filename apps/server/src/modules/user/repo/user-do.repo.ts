import type { EntityData, EntityName, FilterQuery, QueryOrderMap } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Role } from '@modules/role/repo';
import { SchoolEntity } from '@modules/school/repo';
import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common/error';
import { Page, RoleReference } from '@shared/domain/domainobject';
import { type IFindOptions, type Pagination, SortOrder, type SortOrderMap } from '@shared/domain/interface';
import type { EntityId } from '@shared/domain/types';
import { BaseDORepo } from '@shared/repo/base.do.repo';
import { Scope } from '@shared/repo/scope';
import { Consent, MultipleUsersFoundLoggableException, ParentConsent, UserConsent, type UserDoRepo } from '../domain';
import { SecondarySchoolReference, UserDo } from '../domain/do/user.do';
import { UserQuery } from '../domain/query/user-query';
import { ConsentEntity } from './consent.entity';
import { ParentConsentEntity } from './parent-consent.entity';
import { UserScope } from './scope/user.scope';
import { UserConsentEntity } from './user-consent.entity';
import { User, UserSchoolEmbeddable } from './user.entity';

@Injectable()
export class UserDoMikroOrmRepo extends BaseDORepo<UserDo, User> implements UserDoRepo {
	get entityName(): EntityName<User> {
		return User;
	}

	public async find(query: UserQuery, options?: IFindOptions<UserDo>): Promise<Page<UserDo>> {
		const pagination: Pagination = options?.pagination || {};
		const order: QueryOrderMap<User> = this.createQueryOrderMap(options?.order || {});
		const scope: Scope<User> = new UserScope()
			.bySchoolId(query.schoolId)
			.byRoleId(query.roleId)
			.withDiscoverableTrue(query.discoverable)
			.isOutdated(query.isOutdated)
			.whereLastLoginSystemChangeSmallerThan(query.lastLoginSystemChangeSmallerThan)
			.whereLastLoginSystemChangeIsBetween(
				query.lastLoginSystemChangeBetweenStart,
				query.lastLoginSystemChangeBetweenEnd
			)
			.withOutdatedSince(query.outdatedSince)
			.withDeleted(false)
			.allowEmptyQuery(true);

		order._id = order._id ?? SortOrder.asc;

		const [entities, total]: [User[], number] = await this._em.findAndCount(User, scope.query, {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order,
		});

		const entityDos: UserDo[] = entities.map((entity) => this.mapEntityToDO(entity));
		const page: Page<UserDo> = new Page<UserDo>(entityDos, total);
		return page;
	}

	public async findById(id: EntityId, populate = false): Promise<UserDo> {
		const userEntity: User = await this._em.findOneOrFail(this.entityName, id as FilterQuery<User>);

		if (populate) {
			await this._em.populate(userEntity, ['roles', 'school.systems', 'school.currentYear', 'secondarySchools.role']);
			await this.populateRoles(userEntity.roles.getItems());
		}

		return this.mapEntityToDO(userEntity);
	}

	public async findByIds(ids: string[], populate = false): Promise<UserDo[]> {
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

	public async findByIdOrNull(id: EntityId, populate = false): Promise<UserDo | null> {
		const user: User | null = await this._em.findOne(this.entityName, id as FilterQuery<User>);

		if (!user) {
			return null;
		}

		if (populate) {
			await this._em.populate(user, ['roles', 'school.systems', 'school.currentYear', 'secondarySchools.role']);
			await this.populateRoles(user.roles.getItems());
		}

		const domainObject: UserDo = this.mapEntityToDO(user);

		return domainObject;
	}

	public async findByExternalIdOrFail(externalId: string, systemId: string): Promise<UserDo> {
		const userDo: UserDo | null = await this.findByExternalId(externalId, systemId);
		if (userDo) {
			return userDo;
		}
		throw new EntityNotFoundError('User');
	}

	public async findByExternalId(externalId: string, systemId: string): Promise<UserDo | null> {
		const userEntitys: User[] = await this._em.find(User, { externalId }, { populate: ['school.systems'] });

		const users: User[] = userEntitys.filter((user: User): boolean => {
			const { systems } = user.school;
			return systems && !!systems.getItems().find((system): boolean => system.id === systemId);
		});
		if (users.length > 1) {
			throw new MultipleUsersFoundLoggableException(externalId);
		}
		if (users.length === 0) {
			return null;
		}

		const userDo = this.mapEntityToDO(users[0]);
		return userDo;
	}

	public async findByEmail(email: string): Promise<UserDo[]> {
		// find mail case-insensitive by regex
		const userEntitys: User[] = await this._em.find(User, {
			email: new RegExp(`^${email.replace(/\W/g, '\\$&')}$`, 'i'),
		});

		await this._em.populate(userEntitys, ['roles']);

		const userDos: UserDo[] = userEntitys.map((userEntity: User): UserDo => this.mapEntityToDO(userEntity));

		return userDos;
	}

	public mapEntityToDO(entity: User): UserDo {
		const user: UserDo = new UserDo({
			id: entity.id,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			deletedAt: entity.deletedAt,
			discoverable: entity.discoverable,
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
			language: entity.language,
			forcePasswordChange: entity.forcePasswordChange,
			preferences: entity.preferences,
			lastLoginSystemChange: entity.lastLoginSystemChange,
			outdatedSince: entity.outdatedSince,
			previousExternalId: entity.previousExternalId,
			birthday: entity.birthday,
			lastSyncedAt: entity.lastSyncedAt,
			consent: entity.consent ? this.mapConsentEntityToDo(entity.consent) : undefined,
			source: entity.source,
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

	public mapDOToEntityProperties(entityDO: UserDo): EntityData<User> {
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
			lastSyncedAt: entityDO.lastSyncedAt,
			consent: entityDO.consent ? this.mapConsentToEntity(entityDO.consent) : undefined,
			source: entityDO.source,
		};
	}

	private mapConsentEntityToDo(consentEntity: ConsentEntity): Consent {
		const consent = new Consent({
			userConsent: consentEntity.userConsent ? this.mapUserConsentEntityToDo(consentEntity.userConsent) : undefined,
			parentConsents:
				consentEntity.parentConsents !== undefined
					? this.mapParentConsentEntitiesToDo(consentEntity.parentConsents)
					: undefined,
		});

		return consent;
	}

	private mapUserConsentEntityToDo(userConsentEntity: UserConsentEntity): UserConsent {
		const userConsent = new UserConsent({
			form: userConsentEntity.form,
			dateOfPrivacyConsent: userConsentEntity.dateOfPrivacyConsent,
			dateOfTermsOfUseConsent: userConsentEntity.dateOfTermsOfUseConsent,
			privacyConsent: userConsentEntity.privacyConsent,
			termsOfUseConsent: userConsentEntity.termsOfUseConsent,
		});

		return userConsent;
	}

	private mapParentConsentEntitiesToDo(parentConsentEntities: ParentConsentEntity[]): ParentConsent[] {
		const parentConsents = parentConsentEntities.map(
			(parentConsent) =>
				new ParentConsent({
					id: parentConsent._id.toHexString(),
					form: parentConsent.form,
					dateOfPrivacyConsent: parentConsent.dateOfPrivacyConsent,
					dateOfTermsOfUseConsent: parentConsent.dateOfTermsOfUseConsent,
					privacyConsent: parentConsent.privacyConsent,
					termsOfUseConsent: parentConsent.termsOfUseConsent,
				})
		);

		return parentConsents;
	}

	private mapConsentToEntity(consent: Consent): ConsentEntity {
		const consentEntity = new ConsentEntity({
			userConsent: consent.userConsent ? this.mapUserConsentToEntity(consent.userConsent) : undefined,
			parentConsents:
				consent.parentConsents !== undefined ? this.mapParentConsentsToEntity(consent.parentConsents) : undefined,
		});

		return consentEntity;
	}

	private mapParentConsentsToEntity(parentConsents: ParentConsent[]): ParentConsentEntity[] {
		const parentConsentEntities = parentConsents.map(
			(parentConsent) =>
				new ParentConsentEntity({
					_id: new ObjectId(parentConsent.id),
					form: parentConsent.form,
					dateOfPrivacyConsent: parentConsent.dateOfPrivacyConsent,
					dateOfTermsOfUseConsent: parentConsent.dateOfTermsOfUseConsent,
					privacyConsent: parentConsent.privacyConsent,
					termsOfUseConsent: parentConsent.termsOfUseConsent,
				})
		);

		return parentConsentEntities;
	}

	private mapUserConsentToEntity(userConsent: UserConsent): UserConsentEntity {
		const userConsentEntity = new UserConsentEntity({
			form: userConsent.form,
			dateOfPrivacyConsent: userConsent.dateOfPrivacyConsent,
			dateOfTermsOfUseConsent: userConsent.dateOfTermsOfUseConsent,
			privacyConsent: userConsent.privacyConsent,
			termsOfUseConsent: userConsent.termsOfUseConsent,
		});

		return userConsentEntity;
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
