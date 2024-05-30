import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetUserListUc } from '../uc/get-user-list.uc';
import { UserListQuery } from '../uc/query/user-list.query';

@ApiTags('User Management')
@Controller('/user-list')
export class UserListController {
	constructor(private readonly getUserListUc: GetUserListUc) {}

	@Get()
	public getUserList(@Query() query: UserListQuery) {
		const users = this.getUserListUc.execute(query);

		return users;
	}
}
