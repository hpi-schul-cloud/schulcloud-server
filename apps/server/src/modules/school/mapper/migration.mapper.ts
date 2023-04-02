import { Injectable } from '@nestjs/common';
import { OauthMigrationDto } from '../dto/oauth-migration.dto';
import { MigrationResponse } from '../controller/dto';

@Injectable()
export class MigrationMapper {
	public mapDtoToResponse(dto: OauthMigrationDto): MigrationResponse {
		const response: MigrationResponse = new MigrationResponse({
			oauthMigrationPossible: dto.oauthMigrationPossible,
			oauthMigrationMandatory: dto.oauthMigrationMandatory,
			oauthMigrationFinished: dto.oauthMigrationFinished,
			oauthMigrationFinalFinish: dto.oauthMigrationFinalFinish,
			enableMigrationStart: dto.enableMigrationStart,
		});

		return response;
	}
}
