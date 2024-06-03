import { RoleDto } from '@src/modules/role';
import { School } from '@src/modules/school';
import { User } from '../../domain/user';
import { UserListQuery } from '../query/user-list.query';

export interface UserRepo {
	getAndCountUsersBySchoolAndRole(school: School, role: RoleDto, query: UserListQuery): Promise<[User[], number]>;

	getUsersByIds(ids: string[], school: School, role: RoleDto, query: UserListQuery): Promise<User[]>;

	getUsersByIdsInOrderOfIds(ids: string[], query: UserListQuery, limit?: number, offset?: number): Promise<User[]>;

	getAndCountUsersExceptWithIds(
		idsToOmit: string[],
		school: School,
		role: RoleDto,
		query: UserListQuery,
		limit?: number,
		offset?: number
	);

	countUsers(school: School, role: RoleDto): Promise<number>;
}

export const USER_REPO = 'USER_REPO';
