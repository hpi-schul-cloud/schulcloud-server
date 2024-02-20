import { PaginationResponse } from '@shared/controller';
import { ApiProperty } from '@nestjs/swagger';
import { UserResponse } from './user.response';

export class UserListResponse extends PaginationResponse<UserResponse[]> {
	constructor(data, total: number, limit?: number, skip?: number) {
		super(total, skip, limit);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		this.data = data?.length > 0 ? data.map((user) => new UserResponse(user)) : [];
	}

	@ApiProperty({ type: [UserResponse] })
	data: UserResponse[];
}
