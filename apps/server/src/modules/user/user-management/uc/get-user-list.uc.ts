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
		let total = 0;

		if (query.classIds) {
			[users, total] = await this.getAndCountUsersByClasses(query);
		}
		// else if (query.sortQuery?.sortBy === SortableFields.class) {
		// }
		else {
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

	private extractUserIdsFromClasses(classes: Class[]): string[] {
		const userIds = classes.flatMap((c) => c.getUserIds());
		const uniqueUserIds = Array.from(new Set(userIds));

		return uniqueUserIds;
	}

	private async getAndCountUsers(query: UserListQuery): Promise<[User[], number]> {
		const [users, total] = await this.userRepo.getAndCountUsers(query);
		const classes = await this.classRepo.getClassesForSchool(query.schoolId);

		this.addClassesToUsers(users, classes);

		return [users, total];
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
