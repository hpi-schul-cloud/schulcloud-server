import { PaginationResponse } from '@shared/controller';
import { ApiProperty } from '@nestjs/swagger';
import { UserLoginMigrationResponse } from './user-login-migration.response';

export class UserLoginMigrationSearchListResponse extends PaginationResponse<UserLoginMigrationResponse[]> {
	@ApiProperty({ type: [UserLoginMigrationResponse] })
	data: UserLoginMigrationResponse[];

	constructor(data: UserLoginMigrationResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}
}
