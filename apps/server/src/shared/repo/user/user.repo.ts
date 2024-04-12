import { QueryOrderMap, QueryOrderNumeric } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { StringValidator } from '@shared/common';
import { ImportUser, Role, SchoolEntity, User } from '@shared/domain/entity';
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
