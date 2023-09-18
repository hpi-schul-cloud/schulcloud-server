import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import {
	ApiFoundResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { MigrationMapper } from '../mapper/migration.mapper';
import { OauthMigrationDto } from '../uc/dto/oauth-migration.dto';
import { LegacySchoolUc } from '../uc';
import { MigrationBody, MigrationResponse, SchoolParams } from './dto';

/**
 * @deprecated because it uses the deprecated LegacySchoolDo.
 */
@ApiTags('School')
@Authenticate('jwt')
@Controller('school')
export class SchoolController {
	constructor(private readonly schoolUc: LegacySchoolUc, private readonly migrationMapper: MigrationMapper) {}

	@Put(':schoolId/migration')
	@Authenticate('jwt')
	@ApiOkResponse({ description: 'New migrationflags set', type: MigrationResponse })
	@ApiUnauthorizedResponse()
	async setMigration(
		@Param() schoolParams: SchoolParams,
		@Body() migrationBody: MigrationBody,
		@CurrentUser() currentUser: ICurrentUser
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
		@CurrentUser() currentUser: ICurrentUser
	): Promise<MigrationResponse> {
		const migrationDto: OauthMigrationDto = await this.schoolUc.getMigration(schoolParams.schoolId, currentUser.userId);

		const result: MigrationResponse = this.migrationMapper.mapDtoToResponse(migrationDto);

		return result;
	}
}
