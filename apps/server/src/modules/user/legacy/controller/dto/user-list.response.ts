import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller/dto';
import { UserResponse, type UserResponseProps } from './user.response';

export type UserListResponseProps = Omit<UserListResponse, 'data'> & { data: UserResponseProps[] };

export class UserListResponse extends PaginationResponse<UserResponse[]> {
	constructor(response: UserListResponseProps) {
		super(response.total, response.skip, response.limit);
		this.data = response.data?.length > 0 ? response.data.map((user) => new UserResponse(user)) : [];
	}

	@ApiProperty({ type: [UserResponse] })
	data: UserResponse[];
}
