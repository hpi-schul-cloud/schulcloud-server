import { MigrationDto } from '@src/modules/user-login-migration/service/dto/migration.dto';
import { UserMigrationResponse } from '../controller/dto/user-migration.response';

export class UserMigrationMapper {
	static mapDtoToResponse(dto: MigrationDto): UserMigrationResponse {
		const response: UserMigrationResponse = new UserMigrationResponse({
			redirect: dto.redirect,
		});

		return response;
	}
}
