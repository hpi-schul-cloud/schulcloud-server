import { Injectable } from '@nestjs/common';
import { UserMigrationResponse } from '@src/modules/oauth/controller/dto/user-migration.response';
import { MigrationDto } from '../service/dto/migration.dto';

@Injectable()
export class UserMigrationMapper {
	static mapDtoToResponse(dto: MigrationDto): UserMigrationResponse {
		const response: UserMigrationResponse = new UserMigrationResponse({
			redirect: dto.redirect,
		});

		return response;
	}
}
