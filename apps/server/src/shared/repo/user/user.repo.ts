import { QueryOrderMap, QueryOrderNumeric } from '@mikro-orm/core';
import { EntityManager, MongoDriver, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { StringValidator } from '@shared/common';
import { EntityId, IFindOptions, INameMatch, Role, School, SortOrder, User } from '@shared/domain';
import { MongoPatterns } from '../mongo.patterns';

@Injectable()
export class UserRepo {
	constructor(private readonly em: EntityManager<MongoDriver>) {}

	async findById(id: EntityId, populateRoles = false): Promise<User> {
		const user = await this.em.findOneOrFail(User, { id });

		if (populateRoles) {
			await this.em.populate(user, ['roles']);
			await this.populateRoles(user.roles.getItems());
		}

		return user;
	}

	async findOneByIdAndSchoolOrFail(id: EntityId, school: School) {
		const user = await this.em.findOneOrFail(User, { id, school });
		return user;
	}

	/**
	 * used for importusers module to request users not referenced in importusers
	 */
	async findWithoutImportUser(school: School, filters?: INameMatch, options?: IFindOptions<User>): Promise<User[]> {
		const { _id: schoolId } = school;
		if (!ObjectId.isValid(schoolId)) throw new Error('invalid school id');

		const permittedMatch = { schoolId };

		const queryFilterMatch: { $or?: unknown[] } = {};
		if (filters?.fullName && StringValidator.isNotEmptyString(filters.fullName, true)) {
			const escapedName = filters.fullName.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '').trim();
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

		const { pagination, order } = options || {};
		if (order) {
			const orderQuery: QueryOrderMap = {};
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
			pipeline.push({ $skip: pagination?.skip });
		}
		if (pagination?.limit) {
			pipeline.push({ $limit: pagination?.limit });
		}
		const userDocuments = await this.em.aggregate(User, pipeline);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const users = userDocuments.map((userDocument) => this.em.map(User, userDocument));
		return users;
	}

	private async populateRoles(roles: Role[]): Promise<void> {
		for (let i = 0; i < roles.length; i += 1) {
			const role = roles[i];
			if (!role.roles.isInitialized(true)) {
				// eslint-disable-next-line no-await-in-loop
				await this.em.populate(role, ['roles']);
				// eslint-disable-next-line no-await-in-loop
				await this.populateRoles(role.roles.getItems());
			}
		}
	}
}
