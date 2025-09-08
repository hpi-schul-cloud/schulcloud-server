import { ObjectId } from '@mikro-orm/mongodb';
import { Counted, EntityId } from '@shared/domain/types';
import { Account, AccountSave } from '../do';

export abstract class AbstractAccountService {
	/*
	 * The following methods are only needed by nest
	 */

	public abstract searchByUsernamePartialMatch(
		userName: string,
		skip: number,
		limit: number
	): Promise<Counted<Account[]>>;

	public abstract validatePassword(account: Account, comparePassword: string): Promise<boolean>;
	/**
	 * @deprecated For migration purpose only
	 */
	public abstract findMany(offset?: number, limit?: number): Promise<Account[]>;

	/*
	 * The following methods are also needed by feathers
	 */

	public abstract findById(id: EntityId): Promise<Account>;

	public abstract findMultipleByUserId(userIds: EntityId[]): Promise<Account[]>;

	public abstract findByUserId(userId: EntityId): Promise<Account | null>;

	public abstract findByUserIdOrFail(userId: EntityId): Promise<Account>;

	// HINT: it would be preferable to use entityId here. Needs to be checked if this is blocked by lecacy code
	public abstract findByUsernameAndSystemId(username: string, systemId: EntityId | ObjectId): Promise<Account | null>;

	public abstract save(accountSave: AccountSave): Promise<Account>;

	public abstract saveAll(accountSaves: AccountSave[]): Promise<Account[]>;

	public abstract updateUsername(accountId: EntityId, username: string): Promise<Account>;

	/**
	 * @deprecated Used for brute force detection, but will become subject to IDM thus be removed.
	 */
	public abstract updateLastTriedFailedLogin(accountId: EntityId, lastTriedFailedLogin: Date): Promise<Account>;

	public abstract updatePassword(accountId: EntityId, password: string): Promise<Account>;

	public abstract delete(id: EntityId): Promise<void>;

	public abstract deleteByUserId(userId: EntityId): Promise<EntityId[]>;

	public abstract searchByUsernameExactMatch(userName: string): Promise<Counted<Account[]>>;

	public abstract isUniqueEmail(email: string): Promise<boolean>;
}
