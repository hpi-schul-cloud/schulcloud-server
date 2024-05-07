import { EntityDictionary, QueryOrderMap, QueryOrderNumeric } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { StringValidator } from '@shared/common';
import { Role, SchoolEntity, User } from '@shared/domain/entity';
import { IFindOptions, SortOrder } from '@shared/domain/interface';
import { Counted, EntityId, NameMatch } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { MongoPatterns } from '../mongo.patterns';

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
		const { pagination, order } = options || {};
		const { _id: schoolId } = school;
		if (!ObjectId.isValid(schoolId)) throw new Error('invalid school id');

		const nameFilterQuery: { $or?: unknown[] } = {};
		const escapedName: string | undefined = filters?.name
			?.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '')
			.trim();
		if (StringValidator.isNotEmptyString(escapedName, true)) {
			nameFilterQuery.$or = [
				{
					firstName: {
						$regex: escapedName,
						$options: 'i',
					},
				},
				{
					lastName: {
						$regex: escapedName,
						$options: 'i',
					},
				},
			];
		}

		const pipeline: unknown[] = [
			{ $match: { schoolId, deletedAt: null } },
			{ $match: nameFilterQuery },
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
			{
				$project: {
					importusers: 0,
				},
			},
		];

		if (order) {
			const orderQuery: QueryOrderMap<User> = {};
			if (order.firstName) {
				orderQuery.firstName = this.mapSortOrderToNumeric(order.firstName);
			}
			if (order.lastName) {
				orderQuery.lastName = this.mapSortOrderToNumeric(order.lastName);
			}
			pipeline.push({ $sort: orderQuery });
		}

		const paginationPipeline: unknown[] = [];

		if (pagination?.skip) {
			paginationPipeline.push({ $skip: pagination.skip });
		}
		if (pagination?.limit) {
			paginationPipeline.push({ $limit: pagination.limit });
		}

		pipeline.push({
			$facet: {
				total: [{ $count: 'count' }],
				data: paginationPipeline,
			},
		});

		const usersFacet = (await this._em.aggregate(User, pipeline)) as [
			{ total: [{ count: number }]; data: EntityDictionary<User>[] }
		];

		const count: number = usersFacet[0]?.total[0]?.count ?? 0;
		const users: User[] = usersFacet[0].data.map(
			(userEntity: EntityDictionary<User>): User => this._em.map(User, userEntity)
		);

		await this._em.populate(users, ['roles']);

		return [users, count];
	}

	private mapSortOrderToNumeric(sortOrder: SortOrder): QueryOrderNumeric {
		switch (sortOrder) {
			case SortOrder.desc:
				return QueryOrderNumeric.DESC;
			case SortOrder.asc:
			default:
				return QueryOrderNumeric.ASC;
		}
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

	public async findByExternalIds(externalIds: string[]): Promise<string[]> {
		const foundUsers = await this._em.find(
			User,
			{ externalId: { $in: externalIds } },
			{ fields: ['id', 'externalId'] }
		);

		const users = foundUsers.map(({ id }) => id);

		return users;
	}

	public async updateAllUserByLastSyncedAt(userIds: string[]): Promise<void> {
		await this._em.nativeUpdate(
			User,
			{
				id: { $in: userIds },
			},
			{ lastSyncedAt: new Date() }
		);
	}

	public async findUnsynchronizedUserIds(dateOfLastSyncToBeLookedFrom: Date): Promise<string[]> {
		const foundUsers = await this._em.find(User, {
			lastSyncedAt: {
				$lte: dateOfLastSyncToBeLookedFrom,
			},
		});

		return foundUsers.map((user) => user.id);
	}
}
