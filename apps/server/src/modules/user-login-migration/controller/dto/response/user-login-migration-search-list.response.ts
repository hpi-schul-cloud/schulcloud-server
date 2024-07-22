import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';
import { UserLoginMigrationResponse } from './user-login-migration.response';

export class UserLoginMigrationSearchListResponse extends PaginationResponse<UserLoginMigrationResponse[]> {
	@ApiProperty({ type: [UserLoginMigrationResponse], description: 'Contains user login migration responses' })
	data: UserLoginMigrationResponse[];

	constructor(data: UserLoginMigrationResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}
}
