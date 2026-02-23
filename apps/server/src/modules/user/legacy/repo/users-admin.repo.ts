import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { EntityName, ObjectId } from '@mikro-orm/mongodb';
import { UsersSearchQueryParams } from '../controller/dto';
import { UserSearchQuery } from '../interfaces';
import { createMultiDocumentAggregation, SearchQueryHelper } from './helper';

@Injectable()
export class UsersAdminRepo extends BaseRepo<User> {
	get entityName(): EntityName<User> {
		return User;
	}

	public getUserByIdWithNestedData(
		roleId: string | undefined,
		schoolId: EntityId,
		schoolYearId: EntityId | undefined,
		_id?: string
	): Promise<any[]> {
		const query: UserSearchQuery = {
			limit: undefined,
			skip: undefined,
			sort: undefined,
			_id,
			schoolId: new ObjectId(schoolId),
			roles: new ObjectId(roleId),
			schoolYearId: new ObjectId(schoolYearId),
			select: [
				'consentStatus',
				'consent',
				'classes',
				'firstName',
				'lastName',
				'email',
				'createdAt',
				'importHash',
				'birthday',
				'preferences.registrationMailSend',
				'lastLoginSystemChange',
				'outdatedSince',
			],
		};

		SearchQueryHelper.setDeletedFilter(query, new Date());

		const aggregation = createMultiDocumentAggregation(query);

		return this._em.aggregate(User, aggregation);
	}

	public getUsersWithNestedData(
		roleId: string | undefined,
		schoolId: EntityId,
		schoolYearId: EntityId | undefined,
		params: UsersSearchQueryParams
	): Promise<any[]> {
		const query: UserSearchQuery = {
			schoolId: new ObjectId(schoolId),
			roles: new ObjectId(roleId),
			schoolYearId: new ObjectId(schoolYearId),
			select: [
				'consentStatus',
				'consent',
				'classes',
				'firstName',
				'lastName',
				'email',
				'createdAt',
				'importHash',
				'birthday',
				'preferences.registrationMailSend',
				'lastLoginSystemChange',
				'outdatedSince',
			],
			skip: params?.$skip ?? params?.skip,
			limit: params?.$limit ?? params?.limit,
		};

		if (params?.users) query._id = params.users;
		if (params?.consentStatus) query.consentStatus = params.consentStatus;
		if (params?.classes) query.classes = params.classes;
		if (params.$sort) {
			query.sort = {
				...params?.$sort,
			};
		}
		SearchQueryHelper.setSearchParametersIfExist(query, params);
		SearchQueryHelper.setDateParametersIfExists(query, params);

		SearchQueryHelper.setDeletedFilter(query, new Date());

		const aggregation = createMultiDocumentAggregation(query);

		return this._em.aggregate(User, aggregation);
	}
}
