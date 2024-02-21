import { PaginationResponse } from '@shared/controller';
import { ApiProperty } from '@nestjs/swagger';
import { UserResponse } from './user.response';

export class UserListResponse extends PaginationResponse<UserResponse[]> {
	constructor(response: UserListResponse) {
		super(response.total, response.skip, response.limit);
		this.data = response.data?.length > 0 ? response.data.map((user) => new UserResponse(user)) : [];
	}

	@ApiProperty({ type: [UserResponse] })
	data: UserResponse[];
}
