import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { createMultiDocumentAggregation } from 'apps/server/src/modules/user/legacy';
import { ObjectID } from 'bson';
import { UsersSearchQueryParams } from '@modules/user/legacy/controller/dto/users-search.query.params';
import { UserSearchQuery } from '@modules/user/legacy/interfaces/user-search.query';

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
			schoolId: new ObjectID(schoolId),
			roles: new ObjectID(roleId),
			schoolYearId: new ObjectID(schoolYearId),
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
			schoolId: new ObjectID(schoolId),
			roles: new ObjectID(roleId),
			schoolYearId: new ObjectID(schoolYearId),
			sort: {
				...params?.$sort,
			},
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
			skip: params?.$skip || params?.skip,
			limit: params?.$limit || params?.limit,
		};

		if (params?.consentStatus) query.consentStatus = params.consentStatus;
		if (params?.classes) query.classes = params.classes;
		this.setSearchParametersIfExist(query, params);
		this.setDateParametersIfExists(query, params);

		const aggregation = createMultiDocumentAggregation(query);

		return this._em.aggregate(User, aggregation);
	}

	private setSearchParametersIfExist(query: UserSearchQuery, params?: UsersSearchQueryParams) {
		if (params?.searchQuery && params.searchQuery.trim().length !== 0) {
			const amountOfSearchWords = params.searchQuery.split(' ').length;
			const searchQueryElements = this.splitForSearchIndexes(params.searchQuery.trim());
			query.searchQuery = `${params.searchQuery} ${searchQueryElements.join(' ')}`;
			// increase gate by searched word, to get better results
			query.searchFilterGate = searchQueryElements.length * 2 + amountOfSearchWords;
			// recreating sort here, to set searchQuery as first (main) parameter of sorting
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			query.sort = {
				...query.sort,
				searchQuery: 1,
			};
		}
	}

	private setDateParametersIfExists(query: UserSearchQuery, params: UsersSearchQueryParams) {
		const dateParameters = ['createdAt', 'outdatedSince', 'lastLoginSystemChange'];
		for (const dateParam of dateParameters) {
			if (params[dateParam]) {
				this.setDateParameter(query, params, dateParam);
			}
		}
	}

	private setDateParameter(query: UserSearchQuery, params: UsersSearchQueryParams, dateParam: string) {
		if (typeof params[dateParam] === 'object') {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			for (const [key, value] of Object.entries(params[dateParam])) {
				if (['$gt', '$gte', '$lt', '$lte'].includes(key)) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
					params[dateParam][key] = new Date(value);
				}
			}
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			query[dateParam] = params[dateParam];
		} else {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			query[dateParam] = new Date(params[dateParam]);
		}
	}

	private splitForSearchIndexes(...searchTexts: string[]) {
		const arr: string[] = [];
		searchTexts.forEach((item) => {
			item.split(/[\s-]/g).forEach((it) => {
				if (it.length === 0) return;

				arr.push(it.slice(0, 1));
				if (it.length > 1) arr.push(it.slice(0, 2));
				for (let i = 0; i < it.length - 2; i += 1) arr.push(it.slice(i, i + 3));
			});
		});
		return arr;
	}
}
