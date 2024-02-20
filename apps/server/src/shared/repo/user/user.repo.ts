import { QueryOrderMap, QueryOrderNumeric } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { StringValidator } from '@shared/common';
import { ImportUser, Role, SchoolEntity, User } from '@shared/domain/entity';
import { IFindOptions, SortOrder } from '@shared/domain/interface';
import { Counted, EntityId, NameMatch } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { createMultiDocumentAggregation } from 'apps/server/src/modules/user/legacy';
import { ObjectID } from 'bson';
import { MongoPatterns } from '@shared/repo';
import { UsersSearchQueryParams } from '@modules/user/legacy/controller/dto/users-search.query.params';
import { UserSearchQuery } from '@modules/user/legacy/interfaces/user-search.query';

@Injectable()
export class UserRepo extends BaseRepo<User> {
	get entityName() {
		return User;
	}

	async findById(id: EntityId, populate = false): Promise<User> {
		const user = await super.findById(id);

		if (populate) {
			await this._em.populate(user, ['roles', 'school.systems', 'school.currentYear']);
			await this.populateRoles(user.roles.getItems());
		}

		return user;
	}

	async findByIdOrNull(id: EntityId, populate = false): Promise<User | null> {
		const user: User | null = await this._em.findOne(User, { id });

		if (!user) {
			return null;
		}

		if (populate) {
			await this._em.populate(user, ['roles', 'school.systems', 'school.currentYear']);
			await this.populateRoles(user.roles.getItems());
		}

		return user;
	}

	async findByExternalIdOrFail(externalId: string, systemId: string): Promise<User> {
		const [users] = await this._em.findAndCount(User, { externalId }, { populate: ['school.systems'] });
		const resultUser = users.find((user) => {
			const { systems } = user.school;
			return systems && systems.getItems().find((system) => system.id === systemId);
		});
		return resultUser ?? Promise.reject();
	}

	/**
	 * used for importusers module to request users not referenced in importusers
	 */
	async findWithoutImportUser(
		school: SchoolEntity,
		filters?: NameMatch,
		options?: IFindOptions<User>
	): Promise<Counted<User[]>> {
		const { _id: schoolId } = school;
		if (!ObjectId.isValid(schoolId)) throw new Error('invalid school id');

		const existingMatch = { deletedAt: null };
		const permittedMatch = { schoolId };

		const queryFilterMatch: { $or?: unknown[] } = {};
		if (filters?.name && StringValidator.isNotEmptyString(filters.name, true)) {
			const escapedName = filters.name.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '').trim();
			// TODO make db agnostic
			if (StringValidator.isNotEmptyString(escapedName, true)) {
				queryFilterMatch.$or = [
					{
						firstName: {
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							$regex: escapedName,
							$options: 'i',
						},
					},
					{
						lastName: {
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							$regex: escapedName,
							$options: 'i',
						},
					},
				];
			}
		}

		const pipeline: unknown[] = [
			{ $match: existingMatch },
			{ $match: permittedMatch },
			{
				$lookup: {
					from: 'importusers',
					localField: '_id',
					foreignField: 'match_userId',
					as: 'importusers',
				},
			},
			{
				$match: {
					importusers: {
						$size: 0,
					},
				},
			},
			{ $match: queryFilterMatch },
			{
				$project: {
					importusers: 0,
				},
			},
		];

		const countPipeline = [...pipeline];
		countPipeline.push({ $group: { _id: null, count: { $sum: 1 } } });
		const total = (await this._em.aggregate(User, countPipeline)) as { count: number }[];
		const count = total.length > 0 ? total[0].count : 0;
		const { pagination, order } = options || {};

		if (order) {
			const orderQuery: QueryOrderMap<ImportUser> = {};
			if (order.firstName) {
				switch (order.firstName) {
					case SortOrder.desc:
						orderQuery.firstName = QueryOrderNumeric.DESC;
						break;
					case SortOrder.asc:
					default:
						orderQuery.firstName = QueryOrderNumeric.ASC;
						break;
				}
			}
			if (order.lastName) {
				switch (order.lastName) {
					case SortOrder.desc:
						orderQuery.lastName = QueryOrderNumeric.DESC;
						break;
					case SortOrder.asc:
					default:
						orderQuery.lastName = QueryOrderNumeric.ASC;
						break;
				}
			}
			pipeline.push({ $sort: orderQuery });
		}

		if (pagination?.skip) {
			pipeline.push({ $skip: pagination.skip });
		}
		if (pagination?.limit) {
			pipeline.push({ $limit: pagination.limit });
		}

		const userDocuments = await this._em.aggregate(User, pipeline);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const users = userDocuments.map((userDocument) => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const { createdAt, updatedAt, ...newUserDocument } = userDocument;

			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			return this._em.map(User, newUserDocument);
		});
		await this._em.populate(users, ['roles']);
		return [users, count];
	}

	async findByEmail(email: string): Promise<User[]> {
		// find mail case-insensitive by regex
		const promise: Promise<User[]> = this._em.find(User, {
			email: new RegExp(`^${email.replace(/\W/g, '\\$&')}$`, 'i'),
		});
		return promise;
	}

	async deleteUser(userId: EntityId): Promise<number> {
		const deletedUserNumber = await this._em.nativeDelete(User, {
			id: userId,
		});

		return deletedUserNumber;
	}

	async getParentEmailsFromUser(userId: EntityId): Promise<string[]> {
		const user: User | null = await this._em.findOne(User, { id: userId });
		let parentsEmails: string[] = [];
		if (user !== null) {
			parentsEmails = user.parents?.map((parent) => parent.email) ?? [];
		}

		return parentsEmails;
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
		if (params[dateParam] === 'object') {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			for (const [key, value] of Object.entries(params[dateParam])) {
				if (['$gt', '$gte', '$lt', '$lte'].includes(key)) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
					params[dateQuery][key] = new Date(value);
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

	saveWithoutFlush(user: User): void {
		this._em.persist(user);
	}

	async flush(): Promise<void> {
		await this._em.flush();
	}

	public async findUserBySchoolAndName(schoolId: EntityId, firstName: string, lastName: string): Promise<User[]> {
		const users: User[] = await this._em.find(User, { school: schoolId, firstName, lastName });

		return users;
	}
}
