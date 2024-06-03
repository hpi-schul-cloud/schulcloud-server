import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RoleName } from '@shared/domain/interface';
import { Authenticate, CurrentUser, ICurrentUser } from '@src/modules/authentication';
import { GetUserListUc } from '../uc/get-user-list.uc';
import { UserListQuery } from '../uc/query/user-list.query';

@ApiTags('User Management')
@Authenticate('jwt')
@Controller('/user-list')
export class UserListController {
	constructor(private readonly getUserListUc: GetUserListUc) {}

	@Get('/students')
	public getStudentsList(@CurrentUser() currentUser: ICurrentUser, @Query() query: UserListQuery) {
		const users = this.getUserListUc.execute(query, RoleName.STUDENT, currentUser.schoolId, currentUser.userId);

		return users;
	}

	@Get('/teachers')
	public getTeachersList(@CurrentUser() currentUser: ICurrentUser, @Query() query: UserListQuery) {
		const users = this.getUserListUc.execute(query, RoleName.TEACHER, currentUser.schoolId, currentUser.userId);

		return users;
	}
}
