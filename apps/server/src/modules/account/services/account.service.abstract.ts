import { ObjectId } from '@mikro-orm/mongodb';
import { Counted, EntityId } from '@shared/domain';
import { AccountDto, AccountSaveDto } from './dto';

// TODO: split functions which are only needed for feathers

export abstract class AbstractAccountService {
	abstract findById(id: EntityId): Promise<AccountDto>;

	abstract findMultipleByUserId(userIds: EntityId[]): Promise<AccountDto[]>;

	abstract findByUserId(userId: EntityId): Promise<AccountDto | null>;

	abstract findByUserIdOrFail(userId: EntityId): Promise<AccountDto>;

	// HINT: it would be preferable to use entityId here. Needs to be checked if this is blocked by lecacy code
	abstract findByUsernameAndSystemId(username: string, systemId: EntityId | ObjectId): Promise<AccountDto | null>;

	abstract save(accountDto: AccountSaveDto): Promise<AccountDto>;

	abstract updateUsername(accountId: EntityId, username: string): Promise<AccountDto>;

	/**
	 * @deprecated Used for brute force detection, but will become subject to IDM thus be removed.
	 */
	abstract updateLastTriedFailedLogin(accountId: EntityId, lastTriedFailedLogin: Date): Promise<AccountDto>;

	abstract updatePassword(accountId: EntityId, password: string): Promise<AccountDto>;

	abstract delete(id: EntityId): Promise<void>;

	abstract deleteByUserId(userId: EntityId): Promise<void>;

	abstract searchByUsernamePartialMatch(userName: string, skip: number, limit: number): Promise<Counted<AccountDto[]>>;

	abstract searchByUsernameExactMatch(userName: string): Promise<Counted<AccountDto[]>>;

	abstract validatePassword(account: AccountDto, comparePassword: string): Promise<boolean>;
	/**
	 * @deprecated For migration purpose only
	 */
	abstract findMany(offset?: number, limit?: number): Promise<AccountDto[]>;
}
