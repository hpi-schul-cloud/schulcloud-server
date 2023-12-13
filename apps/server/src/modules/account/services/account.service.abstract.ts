import { ObjectId } from '@mikro-orm/mongodb';
import { Counted, EntityId } from '@shared/domain/types';
import { AccountDto, AccountSaveDto } from './dto';
import { Account } from '../domain/account';

export abstract class AbstractAccountService {
	abstract findById(id: EntityId): Promise<Account>;

	abstract findMultipleByUserId(userIds: EntityId[]): Promise<Account[]>;

	abstract findByUserId(userId: EntityId): Promise<Account | null>;

	abstract findByUserIdOrFail(userId: EntityId): Promise<Account>;

	abstract findByUsernameAndSystemId(username: string, systemId: EntityId | ObjectId): Promise<Account | null>;

	abstract save(accountDto: AccountSaveDto): Promise<Account>;

	abstract updateUsername(accountId: EntityId, username: string): Promise<Account>;

	/**
	 * @deprecated Used for brute force detection, but will become subject to IDM thus be removed.
	 */
	abstract updateLastTriedFailedLogin(accountId: EntityId, lastTriedFailedLogin: Date): Promise<Account>;

	abstract updatePassword(accountId: EntityId, password: string): Promise<Account>;

	abstract delete(id: EntityId): Promise<void>;

	abstract deleteByUserId(userId: EntityId): Promise<void>;

	abstract searchByUsernamePartialMatch(userName: string, skip: number, limit: number): Promise<Counted<Account[]>>;

	abstract searchByUsernameExactMatch(userName: string): Promise<Counted<Account[]>>;

	abstract validatePassword(account: AccountDto, comparePassword: string): Promise<boolean>;
	/**
	 * @deprecated For migration purpose only
	 */
	abstract findMany(offset?: number, limit?: number): Promise<Account[]>;
}
