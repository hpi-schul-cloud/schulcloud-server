/* eslint-disable @typescript-eslint/ban-ts-comment */
import { QueryOrderMap, QueryOrderNumeric } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { IFindOptions, INameMatch, School, SortOrder, User } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { UserRepo as DomainUserRepo } from '@shared/repo';
import { StringValidator } from '@shared/common';
import { MongoPatterns } from '@shared/repo/mongo.patterns';

@Injectable()
export class UserRepo extends DomainUserRepo {
	/**
	 * used for importusers // TODO should be moved to that module?!
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
							// @ts-ignore
							$regex: escapedName,
							$options: 'i',
						},
					},
					{
						lastName: {
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
}
