import { Authenticate, CurrentUser, CurrentUserInterface } from '@modules/authentication';
import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import {
	ApiFoundResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { MigrationMapper } from '../mapper/migration.mapper';
import { LegacySchoolUc } from '../uc';
import { OauthMigrationDto } from '../uc/dto/oauth-migration.dto';
import { MigrationBody, MigrationResponse, SchoolParams } from './dto';

/**
 * @deprecated because it uses the deprecated LegacySchoolDo.
 */
@ApiTags('School')
@Authenticate('jwt')
@Controller('school')
export class LegacySchoolController {
	constructor(private readonly schoolUc: LegacySchoolUc, private readonly migrationMapper: MigrationMapper) {}

	@Put(':schoolId/migration')
	@Authenticate('jwt')
	@ApiOkResponse({ description: 'New migrationflags set', type: MigrationResponse })
	@ApiUnauthorizedResponse()
	async setMigration(
		@Param() schoolParams: SchoolParams,
		@Body() migrationBody: MigrationBody,
		@CurrentUser() currentUser: CurrentUserInterface
	): Promise<MigrationResponse> {
		const migrationDto: OauthMigrationDto = await this.schoolUc.setMigration(
			schoolParams.schoolId,
			!!migrationBody.oauthMigrationPossible,
			!!migrationBody.oauthMigrationMandatory,
			!!migrationBody.oauthMigrationFinished,
			currentUser.userId
		);

		const result: MigrationResponse = this.migrationMapper.mapDtoToResponse(migrationDto);

		return result;
	}

	@Get(':schoolId/migration')
	@Authenticate('jwt')
	@ApiFoundResponse({ description: 'Migrationflags have been found.', type: MigrationResponse })
	@ApiUnauthorizedResponse()
	@ApiNotFoundResponse({ description: 'Migrationsflags could not be found for the given school' })
	async getMigration(
		@Param() schoolParams: SchoolParams,
		@CurrentUser() currentUser: CurrentUserInterface
	): Promise<MigrationResponse> {
		const migrationDto: OauthMigrationDto = await this.schoolUc.getMigration(schoolParams.schoolId, currentUser.userId);

		const result: MigrationResponse = this.migrationMapper.mapDtoToResponse(migrationDto);

		return result;
	}
}
