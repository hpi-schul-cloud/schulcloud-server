import { Injectable } from '@nestjs/common';
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
			const classes = await this.classRepo.getClassesForSchool(query.schoolId);
		}
		// else if (query.sortQuery?.sortBy === SortableFields.class) {
		// }
		else {
			const us = await this.userRepo.getUsers(query);
			const classes = await this.classRepo.getClassesForSchool(query.schoolId);

			us.forEach((u) => {
				classes.forEach((c) => {
					if (c.isClassOfUser(u.id)) {
						u.addClass(c);
					}
				});
			});

			users = us;
		}

		const dto = UserListDtoMapper.mapToDto(users, query);

		return dto;
	}
}
