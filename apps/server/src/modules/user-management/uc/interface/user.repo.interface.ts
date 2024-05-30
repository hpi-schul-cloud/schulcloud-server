import { User } from '../../domain/user';
import { UserListQuery } from '../query/user-list.query';

export interface UserRepo {
	getAndCountUsers(query: UserListQuery): Promise<[User[], number]>;

	getUsersByIds(ids: string[], query: UserListQuery): Promise<User[]>;

	getUsersByIdsInOrderOfIds(ids: string[], query: UserListQuery, limit?: number, offset?: number): Promise<User[]>;

	getAndCountUsersExceptWithIds(idsToOmit: string[], query: UserListQuery, limit?: number, offset?: number);

	countUsers(query: UserListQuery): Promise<number>;
}

export const USER_REPO = 'USER_REPO';
