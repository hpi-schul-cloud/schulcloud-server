import { Action, AuthorizationService } from '@modules/authorization';
import { RoleService } from '@modules/role';
import { SchoolService } from '@modules/school';
import { Injectable } from '@nestjs/common';
import { Permission, RoleName } from '@shared/domain/interface';
import { User } from '../domain/user';
import { UserListDtoMapper } from './mapper/user-list.dto.mapper';
import { UserListQuery } from './query/user-list.query';
import { SortableField } from './type/sortable-field';
import { UserListService } from './user-list.service';

@Injectable()
export class GetUserListUc {
	constructor(
		private readonly schoolService: SchoolService,
		private readonly roleService: RoleService,
		private readonly userListService: UserListService,
		private readonly authorizationService: AuthorizationService
	) {}

	public async execute(query: UserListQuery, roleName: RoleName, schoolId: string, userId: string) {
		const [role, school, user] = await Promise.all([
			this.roleService.findByName(roleName),
			this.schoolService.getSchoolById(schoolId),
			this.authorizationService.getUserWithPermissions(userId),
		]);

		this.authorizationService.checkPermission(user, school, {
			action: Action.read,
			requiredPermissions: [Permission.STUDENT_LIST, Permission.TEACHER_LIST],
		});

		// TODO: authorization
		// @TODO add authorization to check if the user is allowed to see the users of the classes

		const { limit, offset } = query;

		let users: User[] = [];
		let total = 0;

		// The following distinction is for performance reasons.
		// If the results shall be filtered or sorted by class, we cannot paginate the users before attaching the classes.
		// To load all users and then attach the classes is too slow. Thus we only load the needed users from the classes and paginate afterwards.
		if (query.classIds) {
			[users, total] = await this.userListService.getAndCountUsersByClasses(query, school, role);
		} else if (query.sortBy === SortableField.class) {
			[users, total] = await this.userListService.getAndCountUsersSortedByClass(query, school, role);
		} else {
			[users, total] = await this.userListService.getAndCountUsers(query, school, role);
		}

		const dto = UserListDtoMapper.mapToDto(users, limit, offset, total);

		return dto;
	}
}
