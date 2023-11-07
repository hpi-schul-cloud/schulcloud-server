import { Authenticate, CurrentUser } from '@modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@modules/authentication/interface/user';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SchoolUc } from '../../domain';
import { SchoolResponseMapper } from './mapper';
import { SchoolQueryParams, SchoolUrlParams } from './param';
import { SchoolForExternalInviteResponse, SchoolResponse } from './response';

@ApiTags('School')
@Authenticate('jwt')
@Controller('school')
export class SchoolController {
	constructor(private readonly schoolUc: SchoolUc) {}

	// TODO: I suggest to add /id to the route. Without it, this controller action needs to be below the other one,
	// because any route parameter would be catched by /:schoolId, e.g. "list-for-external-invite".
	// It seems safer to not need to worry about the order of the actions.
	@Get('/id/:schoolId')
	public async getSchool(
		@Param() urlParams: SchoolUrlParams,
		@CurrentUser() user: ICurrentUser
	): Promise<SchoolResponse> {
		const school = await this.schoolUc.getSchool(urlParams.schoolId, user.userId);

		const res = SchoolResponseMapper.mapToResponse(school);

		return res;
	}

	// TODO: Do we have a convention for the casing of routes?
	@Get('/list-for-external-invite')
	public async getSchoolListForExternalInvite(
		@Query() query: SchoolQueryParams,
		@CurrentUser() user: ICurrentUser
	): Promise<SchoolForExternalInviteResponse[]> {
		const schools = await this.schoolUc.getSchoolListForExternalInvite(query, user.schoolId);

		const res = SchoolResponseMapper.mapToListForExternalInviteResponse(schools);

		return res;
	}
}
