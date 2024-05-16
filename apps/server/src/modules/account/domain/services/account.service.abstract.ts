import { ObjectId } from '@mikro-orm/mongodb';
import { Counted, EntityId } from '@shared/domain/types';
import { Account, AccountSave } from '..';

export abstract class AbstractAccountService {
	/*
	 * The following methods are only needed by nest
	 */

	abstract searchByUsernamePartialMatch(userName: string, skip: number, limit: number): Promise<Counted<Account[]>>;

	abstract validatePassword(account: Account, comparePassword: string): Promise<boolean>;
	/**
	 * @deprecated For migration purpose only
	 */
	abstract findMany(offset?: number, limit?: number): Promise<Account[]>;

	/*
	 * The following methods are also needed by feathers
	 */

	abstract findById(id: EntityId): Promise<Account>;

	abstract findMultipleByUserId(userIds: EntityId[]): Promise<Account[]>;

	abstract findByUserId(userId: EntityId): Promise<Account | null>;

	abstract findByUserIdOrFail(userId: EntityId): Promise<Account>;

	// HINT: it would be preferable to use entityId here. Needs to be checked if this is blocked by lecacy code
	abstract findByUsernameAndSystemId(username: string, systemId: EntityId | ObjectId): Promise<Account | null>;

	abstract save(accountSave: AccountSave): Promise<Account>;

	abstract updateUsername(accountId: EntityId, username: string): Promise<Account>;

	/**
	 * @deprecated Used for brute force detection, but will become subject to IDM thus be removed.
	 */
	abstract updateLastTriedFailedLogin(accountId: EntityId, lastTriedFailedLogin: Date): Promise<Account>;

	abstract updatePassword(accountId: EntityId, password: string): Promise<Account>;

	abstract delete(id: EntityId): Promise<void>;

	abstract deleteByUserId(userId: EntityId): Promise<EntityId[]>;

	abstract searchByUsernameExactMatch(userName: string): Promise<Counted<Account[]>>;
}
