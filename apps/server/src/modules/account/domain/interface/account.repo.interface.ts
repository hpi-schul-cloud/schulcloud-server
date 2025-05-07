import { EntityId } from '@shared/domain/types';

import { ObjectId } from '@mikro-orm/mongodb';
import { Counted } from '@shared/domain/types';
import { Account } from '../do';

export interface AccountRepo {
	save(account: Account): Promise<Account>;

	saveAll(accounts: Account[]): Promise<Account[]>;

	findById(id: EntityId | ObjectId): Promise<Account>;

	findByUserId(userId: EntityId | ObjectId): Promise<Account | null>;

	findMultipleByUserId(userIds: EntityId[] | ObjectId[]): Promise<Account[]>;

	findByUserIdOrFail(userId: EntityId | ObjectId): Promise<Account>;

	findByUsername(username: string): Promise<Account | null>;

	findByUsernameAndSystemId(username: string, systemId: EntityId | ObjectId): Promise<Account | null>;

	searchByUsernameExactMatch(username: string, offset: number, limit: number): Promise<Counted<Account[]>>;
	searchByUsernameExactMatch(username: string, offset: number): Promise<Counted<Account[]>>;
	searchByUsernameExactMatch(username: string): Promise<Counted<Account[]>>;

	searchByUsernamePartialMatch(username: string, offset: number, limit: number): Promise<Counted<Account[]>>;
	searchByUsernamePartialMatch(username: string, offset: number): Promise<Counted<Account[]>>;
	searchByUsernamePartialMatch(username: string): Promise<Counted<Account[]>>;

	deleteById(accountId: EntityId | ObjectId): Promise<void>;

	deleteByUserId(userId: EntityId): Promise<EntityId[]>;

	findMany(offset: number, limit: number): Promise<Account[]>;
	findMany(offset: number): Promise<Account[]>;
	findMany(): Promise<Account[]>;

	findByUserIdsAndSystemId(userIds: string[], systemId: string): Promise<string[]>;
}

export const ACCOUNT_REPO = Symbol('ACCOUNT_REPO');
