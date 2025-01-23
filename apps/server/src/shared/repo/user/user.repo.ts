import { EntityName } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import type { ImportUserNameMatchFilter } from '@modules/user-import/domain/interface';
import { Injectable } from '@nestjs/common';
import type { Role } from '@shared/domain/entity/role.entity';
import type { SchoolEntity } from '@shared/domain/entity/school.entity';
import { User } from '@shared/domain/entity/user.entity';
import type { IFindOptions } from '@shared/domain/interface';
import type { Counted, EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { UserScope } from './user.scope';

@Injectable()
export class UserRepo extends BaseRepo<User> {
	get entityName(): EntityName<User> {
		return User;
	}

	public async findById(id: EntityId, populate = false): Promise<User> {
		const user = await super.findById(id);

		if (populate) {
			await this._em.populate(user, ['roles', 'school.systems', 'school.currentYear']);
			await this.populateRoles(user.roles.getItems());
		}

		return user;
	}

	public async findByIdOrNull(id: EntityId, populate = false): Promise<User | null> {
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

	public async findByExternalIdOrFail(externalId: string, systemId: string): Promise<User> {
		const [users] = await this._em.findAndCount(User, { externalId }, { populate: ['school.systems'] });
		const resultUser = users.find((user) => {
			const { systems } = user.school;
			return systems && systems.getItems().find((system) => system.id === systemId);
		});
		return resultUser ?? Promise.reject();
	}

	public async findForImportUser(
		school: SchoolEntity,
		filters?: ImportUserNameMatchFilter,
		options?: IFindOptions<User>
	): Promise<Counted<User[]>> {
		const { pagination, order } = options || {};
		const { id: schoolId } = school;
		if (!ObjectId.isValid(schoolId)) throw new Error('invalid school id');

		const scope: UserScope = new UserScope().bySchoolId(schoolId).byName(filters?.name).withDeleted(false);

		const countedUsers = await this._em.findAndCount(User, scope.query, {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order,
			populate: ['roles'],
		});

		return countedUsers;
	}

	public findByEmail(email: string): Promise<User[]> {
		// find mail case-insensitive by regex
		const promise: Promise<User[]> = this._em.find(User, {
			email: new RegExp(`^${email.replace(/\W/g, '\\$&')}$`, 'i'),
		});
		return promise;
	}

	public async deleteUser(userId: EntityId): Promise<number> {
		const deletedUserNumber = await this._em.nativeDelete(User, {
			id: userId,
		});

		return deletedUserNumber;
	}

	public async getParentEmailsFromUser(userId: EntityId): Promise<string[]> {
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

	public saveWithoutFlush(user: User): void {
		this._em.persist(user);
	}

	public async flush(): Promise<void> {
		await this._em.flush();
	}

	public async findUserBySchoolAndName(schoolId: EntityId, firstName: string, lastName: string): Promise<User[]> {
		const users: User[] = await this._em.find(User, { school: schoolId, firstName, lastName });

		return users;
	}

	public async findByExternalIds(externalIds: EntityId[]): Promise<EntityId[]> {
		const foundUsers = await this._em.find(
			User,
			{ externalId: { $in: externalIds } },
			{ fields: ['id', 'externalId'] }
		);

		const userIds = foundUsers.map(({ id }) => id);

		return userIds;
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
