import { Injectable } from '@nestjs/common';
import { Class } from '../domain/class';
import { User } from '../domain/user';
import { ClassMikroOrmRepo } from '../repo/class.repo';
import { UserMikroOrmRepo } from '../repo/user.repo';
import { UserListDtoMapper } from './mapper/user-list.dto.mapper';
import { SortableFields, UserListQuery } from './query/user-list.query';

@Injectable()
export class GetUserListUc {
	constructor(private readonly userRepo: UserMikroOrmRepo, private readonly classRepo: ClassMikroOrmRepo) {}

	public async execute(query: UserListQuery) {
		// TODO: authorization

		let users: User[] = [];
		let total = 0;

		if (query.classIds) {
			[users, total] = await this.getAndCountUsersByClasses(query);
		} else if (query.sortBy === SortableFields.class) {
			[users, total] = await this.getAndCountUsersSortedByClass(query);
		} else {
			[users, total] = await this.getAndCountUsers(query);
		}

		const dto = UserListDtoMapper.mapToDto(users, query, total);

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
			const usersWithClasses = await this.userRepo.getUsersByIdsInOrderOfIds(idsOfUsersWithClasses, query);
			this.addClassesToUsers(usersWithClasses, classes);

			if (usersWithClasses.length < query.limit) {
				const usersWithoutClasses = await this.userRepo.getUsersExceptWithIds(
					idsOfUsersWithClasses,
					query.limit - usersWithClasses.length,
					query
				);
				users = usersWithClasses.concat(usersWithoutClasses);
			} else {
				users = usersWithClasses;
			}
		} else {
			const usersWithoutClasses = await this.userRepo.getUsersExceptWithIds(idsOfUsersWithClasses, query.limit, query);

			if (usersWithoutClasses.length < query.limit) {
				const usersWithClasses = await this.userRepo.getUsersByIdsInOrderOfIds(idsOfUsersWithClasses, query);
				this.addClassesToUsers(usersWithClasses, classes);

				const usersToAppend = usersWithClasses.slice(0, query.limit - usersWithoutClasses.length);
				users = usersWithoutClasses.concat(usersToAppend);
			} else {
				users = usersWithoutClasses;
			}
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
}
