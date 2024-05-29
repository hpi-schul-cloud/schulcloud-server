import { Injectable } from '@nestjs/common';
import { Class } from '../domain/class';
import { User } from '../domain/user';
import { ClassMikroOrmRepo } from '../repo/class.repo';
import { UserMikroOrmRepo } from '../repo/user.repo';
import { UserListDtoMapper } from './mapper/user-list.dto.mapper';
import { UserListQuery } from './query/user-list.query';

@Injectable()
export class GetUserListUc {
	constructor(private readonly userRepo: UserMikroOrmRepo, private readonly classRepo: ClassMikroOrmRepo) {}

	public async execute(query: UserListQuery) {
		// TODO: authorization

		let users: User[] = [];

		if (query.classIds) {
			users = await this.getUsersByClasses(query);
		}
		// else if (query.sortQuery?.sortBy === SortableFields.class) {
		// }
		else {
			users = await this.getUsers(query);
		}

		const dto = UserListDtoMapper.mapToDto(users, query);

		return dto;
	}

	private async getUsersByClasses(query: UserListQuery) {
		if (!query.classIds) {
			throw new Error('The query must contain classIds for this method.');
		}

		const classes = await this.classRepo.getClassesByIds(query.classIds);
		const userIds = this.extractUserIdsFromClasses(classes);
		const users = await this.userRepo.getUsersByIds(userIds, query);

		this.addClassesToUsers(users, classes);

		return users;
	}

	private extractUserIdsFromClasses(classes: Class[]): string[] {
		const userIds = classes.flatMap((c) => c.getUserIds());
		const uniqueUserIds = Array.from(new Set(userIds));

		return uniqueUserIds;
	}

	private async getUsers(query: UserListQuery): Promise<User[]> {
		const users = await this.userRepo.getUsers(query);
		const classes = await this.classRepo.getClassesForSchool(query.schoolId);

		this.addClassesToUsers(users, classes);

		return users;
	}

	private addClassesToUsers(users: User[], classes: Class[]) {
		users.forEach((u) => {
			classes.forEach((c) => {
				if (c.isClassOfUser(u.id)) {
					u.addClass(c);
				}
			});
		});
	}
}
