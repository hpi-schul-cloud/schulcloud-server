import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { ObjectId } from 'bson';
import { UsersSearchQueryParams } from '../controller/dto';
import { UserSearchQuery } from '../interfaces';
import { createMultiDocumentAggregation, SearchQueryHelper } from './helper';

@Injectable()
export class UsersAdminRepo extends BaseRepo<User> {
	get entityName() {
		return User;
	}

	async getUserByIdWithNestedData(
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

		const aggregation = createMultiDocumentAggregation(query);

		return this._em.aggregate(User, aggregation);
	}

	async getUsersWithNestedData(
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
				'isEditable',
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

		const aggregation = createMultiDocumentAggregation(query);

		return this._em.aggregate(User, aggregation);
	}
}
