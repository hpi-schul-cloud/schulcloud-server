import {
	ApiFoundResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { SchoolUc } from '../uc/school.uc';
import { MigrationBody, MigrationResponse, SchoolParams } from './dto';

@ApiTags('School')
@Authenticate('jwt')
@Controller('school')
export class SchoolController {
	constructor(private readonly schoolUc: SchoolUc) {}

	@Put(':schoolId/migration')
	@ApiOkResponse({ description: 'New migrationflags set', type: MigrationResponse })
	@ApiUnauthorizedResponse()
	async setMigration(
		@Param() schoolParams: SchoolParams,
		@Body() migrationBody: MigrationBody,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<MigrationResponse> {
		const result: MigrationResponse = await this.schoolUc.setMigration(
			schoolParams.schoolId,
			migrationBody.oauthMigrationPossible,
			migrationBody.oauthMigrationMandatory,
			migrationBody.oauthMigrationFinished,
			currentUser.userId
		);

		return result;
	}

	@Get(':schoolId/migration')
	@ApiFoundResponse({ description: 'Migrationflags have been found.', type: MigrationResponse })
	@ApiUnauthorizedResponse()
	@ApiNotFoundResponse({ description: 'Migrationsflags could not be found for the given school' })
	async getMigration(
		@Param() schoolParams: SchoolParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<MigrationResponse> {
		const result: MigrationResponse = await this.schoolUc.getMigration(schoolParams.schoolId, currentUser.userId);
		return result;
	}
}
