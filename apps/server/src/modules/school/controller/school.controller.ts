import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';
import { SchoolUc } from '../uc/school.uc';
import { MigrationBody, MigrationResponse, SchoolParams } from './dto';

@ApiTags('School')
@Authenticate('jwt')
@Controller('school')
export class SchoolController {
	constructor(private readonly schoolUc: SchoolUc) {}

	@Patch(':schoolId/migration')
	async setMigration(
		@Param() schoolParams: SchoolParams,
		@Body() migrationBody: MigrationBody,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<MigrationResponse> {
		const result = await this.schoolUc.setMigration(
			schoolParams.schoolId,
			migrationBody.oauthMigrationPossible,
			migrationBody.oauthMigrationMandatory
		);

		return result;
	}
}
