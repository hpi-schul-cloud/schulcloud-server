import { UserMigrationResponse } from '../controller/dto/user-migration.response';
import { MigrationDto } from '../../user-login-migration/service/dto/migration.dto';

export class UserMigrationMapper {
	static mapDtoToResponse(dto: MigrationDto): UserMigrationResponse {
		const response: UserMigrationResponse = new UserMigrationResponse({
			redirect: dto.redirect,
		});

		return response;
	}
}
