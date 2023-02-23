import { Injectable } from '@nestjs/common';
import { UserMigrationResponse } from '@src/modules/oauth/controller/dto/user-migration.response';
import { UserMigrationDto } from '../service/dto/userMigration.dto';

@Injectable()
export class UserMigrationMapper {
	static mapDtoToResponse(dto: UserMigrationDto): UserMigrationResponse {
		const response: UserMigrationResponse = new UserMigrationResponse({
			redirect: dto.redirect,
		});

		return response;
	}
}
