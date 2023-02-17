import { Injectable } from '@nestjs/common';
import { UserMigrationDto } from '../service/dto/userMigration.dto';
import { UserMigrationResponse } from '../../oauth/controller/dto/user-migration.response';

@Injectable()
export class UserMigrationMapper {
	static mapDtoToResponse(dto: UserMigrationDto): UserMigrationResponse {
		const response: UserMigrationResponse = new UserMigrationResponse({
			redirect: dto.redirect,
		});

		return response;
	}
}
