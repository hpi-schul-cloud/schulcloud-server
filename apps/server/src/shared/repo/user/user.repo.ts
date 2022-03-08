import { QueryOrderMap, QueryOrderNumeric, wrap } from '@mikro-orm/core';
import { EntityManager, MongoDriver, ObjectId } from '@mikro-orm/mongodb';
import { Injectable, NotFoundException } from '@nestjs/common';
import { StringValidator } from '@shared/common';
import { Counted, EntityId, IFindOptions, INameMatch, Role, School, SortOrder, User } from '@shared/domain';
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

	async findByLdapId(ldapId: string, systemId: string): Promise<User> {
		const users: [User[], number] = await this.em.findAndCount(User, { ldapId }, { populate: ['school.systems'] });
		let resultUser;
		users[0].forEach((user) => {
			const { systems } = user.school;
			if (systems && systems.getItems().find((system) => system.id === systemId)) {
				resultUser = user;
			}
		});
		if (resultUser) {
			return resultUser as User;
		}
		throw new NotFoundException('No user for this ldapId found');
	}

	/**
	 * used for importusers module to request users not referenced in importusers
	 */
	async findWithoutImportUser(
		school: School,
		filters?: INameMatch,
		options?: IFindOptions<User>
	): Promise<Counted<User[]>> {
		const { _id: schoolId } = school;
		if (!ObjectId.isValid(schoolId)) throw new Error('invalid school id');

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
		const total = (await this.em.aggregate(User, countPipeline)) as { count: number }[];
		const count = total.length > 0 ? total[0].count : 0;
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
		await this.em.populate(users, 'roles');
		return [users, count];
	}

	async update(user: User): Promise<User> {
		const entity = await this.em.findOneOrFail(User, { id: user.id });
		wrap(entity).assign(user);
		await this.em.flush();
		return entity;
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
