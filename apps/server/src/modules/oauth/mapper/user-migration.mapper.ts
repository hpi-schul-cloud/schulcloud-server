import { MigrationDto } from '@src/modules/user-login-migration/service/dto';
import { UserMigrationResponse } from '../controller/dto';

export class UserMigrationMapper {
	static mapDtoToResponse(dto: MigrationDto): UserMigrationResponse {
		const response: UserMigrationResponse = new UserMigrationResponse({
			redirect: dto.redirect,
		});

		return response;
	}
}
