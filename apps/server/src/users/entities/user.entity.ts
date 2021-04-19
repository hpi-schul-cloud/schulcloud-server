import { ApiProperty } from '@nestjs/swagger';
import { JwtPayload } from '../../auth/interfaces/jwt-payload';

export class UserEntity {
	constructor(payload: JwtPayload) {
		// TODO Builder
		this.userId = payload.userId;
		this.schoolId = payload.schoolId;
		this.roles = payload.roles;
	}
	@ApiProperty()
	userId: string;
	@ApiProperty()
	schoolId: string;
	@ApiProperty()
	roles: string[];
}
