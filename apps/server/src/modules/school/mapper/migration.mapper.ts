import { Injectable } from '@nestjs/common';
import { MigrationDto } from '../dto/migration.dto';
import { MigrationResponse } from '../controller/dto';

@Injectable()
export class MigrationMapper {
	public mapDtoToResponse(dto: MigrationDto): MigrationResponse {
		const response: MigrationResponse = new MigrationResponse({
			oauthMigrationPossible: dto.oauthMigrationPossible,
			oauthMigrationMandatory: dto.oauthMigrationMandatory,
			oauthMigrationFinished: dto.oauthMigrationFinished,
			enableMigrationStart: dto.enableMigrationStart,
		});

		return response;
	}
}
