import { Inject, Injectable } from '@nestjs/common';
import { Class } from '../domain/class';
import { User } from '../domain/user';
import { ClassMikroOrmRepo } from '../repo/class.repo';
import { UserMikroOrmRepo } from '../repo/user.repo';
import { CLASS_REPO } from './interface/class.repo.interface';
import { USER_REPO } from './interface/user.repo.interface';
import { UserListDtoMapper } from './mapper/user-list.dto.mapper';
import { SortableFields, UserListQuery } from './query/user-list.query';

@Injectable()
export class GetUserListUc {
	constructor(
		@Inject(USER_REPO) private readonly userRepo: UserMikroOrmRepo,
		@Inject(CLASS_REPO) private readonly classRepo: ClassMikroOrmRepo
	) {}

	public async execute(query: UserListQuery) {
		// TODO: authorization

		const { limit, offset } = query;

		let users: User[] = [];
		let total = 0;

		if (query.classIds) {
			[users, total] = await this.getAndCountUsersByClasses(query);
		} else if (query.sortBy === SortableFields.class) {
			[users, total] = await this.getAndCountUsersSortedByClass(query);
		} else {
			[users, total] = await this.getAndCountUsers(query);
		}

		const dto = UserListDtoMapper.mapToDto(users, limit, offset, total);

		return dto;
	}

	private async getAndCountUsersByClasses(query: UserListQuery): Promise<[User[], number]> {
		if (!query.classIds) {
			throw new Error('The query must contain classIds for this method.');
		}

		const classes = await this.classRepo.getClassesByIds(query.classIds);
		const userIds = this.extractUserIdsFromClasses(classes);
		const totalNumberOfUsers = userIds.length;

		const users = await this.userRepo.getUsersByIds(userIds, query);

		this.addClassesToUsers(users, classes);

		return [users, totalNumberOfUsers];
	}

	private async getAndCountUsersSortedByClass(query: UserListQuery): Promise<[User[], number]> {
		const classes = await this.classRepo.getClassesForSchool(query.schoolId, query.sortOrder);
		const idsOfUsersWithClasses = this.extractUserIdsFromClasses(classes);

		let users: User[] = [];

		if (query.sortOrder === -1) {
			users = await this.getUsersSortedByClassDescendingly(idsOfUsersWithClasses, query, classes);
		} else {
			users = await this.getUsersSortedByClassAscendingly(idsOfUsersWithClasses, query, classes);
		}

		const total = await this.userRepo.countUsers(query);

		return [users, total];
	}

	private async getAndCountUsers(query: UserListQuery): Promise<[User[], number]> {
		const [users, total] = await this.userRepo.getAndCountUsers(query);
		const classes = await this.classRepo.getClassesForSchool(query.schoolId);

		this.addClassesToUsers(users, classes);

		return [users, total];
	}

	private extractUserIdsFromClasses(classes: Class[]): string[] {
		const userIds = classes.flatMap((c) => c.getUserIds());
		const uniqueUserIds = Array.from(new Set(userIds));

		return uniqueUserIds;
	}

	private addClassesToUsers(users: User[], classes: Class[]): void {
		users.forEach((u) => {
			classes.forEach((c) => {
				if (c.isClassOfUser(u.id)) {
					u.addClass(c);
				}
			});
		});
	}

	private async getUsersSortedByClassDescendingly(
		idsOfUsersWithClasses: string[],
		query: UserListQuery,
		classes: Class[]
	) {
		let users: User[] = [];

		const usersWithClasses = await this.userRepo.getUsersByIdsInOrderOfIds(idsOfUsersWithClasses, query);
		this.addClassesToUsers(usersWithClasses, classes);

		if (usersWithClasses.length < query.limit) {
			users = await this.addUsersWithoutClasses(query, usersWithClasses, idsOfUsersWithClasses);
		} else {
			users = usersWithClasses;
		}

		return users;
	}

	private async getUsersSortedByClassAscendingly(
		idsOfUsersWithClasses: string[],
		query: UserListQuery,
		classes: Class[]
	) {
		let users: User[] = [];

		const [usersWithoutClasses, numberOfUsersWithoutClasses] = await this.userRepo.getAndCountUsersExceptWithIds(
			idsOfUsersWithClasses,
			query
		);

		if (usersWithoutClasses.length < query.limit) {
			users = await this.addUsersWithClasses(
				query,
				usersWithoutClasses,
				numberOfUsersWithoutClasses,
				idsOfUsersWithClasses,
				classes
			);
		} else {
			users = usersWithoutClasses;
		}

		return users;
	}

	private async addUsersWithoutClasses(
		query: UserListQuery,
		usersWithClasses: User[],
		idsOfUsersWithClasses: string[]
	) {
		const limit = query.limit - usersWithClasses.length;
		const offset = 0;
		const [usersWithoutClasses] = await this.userRepo.getAndCountUsersExceptWithIds(
			idsOfUsersWithClasses,
			query,
			limit,
			offset
		);
		const users = usersWithClasses.concat(usersWithoutClasses);

		return users;
	}

	private async addUsersWithClasses(
		query: UserListQuery,
		usersWithoutClasses: User[],
		numberOfUsersWithoutClasses: number,
		idsOfUsersWithClasses: string[],
		classes: Class[]
	) {
		const limit = query.limit - usersWithoutClasses.length;
		let offset = 0;

		if (numberOfUsersWithoutClasses < query.offset) {
			offset = query.offset - numberOfUsersWithoutClasses;
		}

		const usersWithClasses = await this.userRepo.getUsersByIdsInOrderOfIds(idsOfUsersWithClasses, query, limit, offset);
		this.addClassesToUsers(usersWithClasses, classes);

		const users = usersWithoutClasses.concat(usersWithClasses);

		return users;
	}
}
