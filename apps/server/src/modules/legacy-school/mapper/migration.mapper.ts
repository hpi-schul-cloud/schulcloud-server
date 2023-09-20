import { Injectable } from '@nestjs/common';
import { MigrationResponse } from '../controller/dto';
import { OauthMigrationDto } from '../uc/dto/oauth-migration.dto';

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
