import { Authenticate, CurrentUser } from '@modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@modules/authentication/interface/user';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SchoolQueryParams, SchoolUrlParams } from './dto/param';
import { SchoolForExternalInviteResponse, SchoolResponse } from './dto/response';
import { SchoolExistsResponse } from './dto/response/school-exists.response';
import { SchoolForLoginResponse } from './dto/response/school-for-login.response';
import { SchoolUc } from './school.uc';

@ApiTags('School')
@Controller('school')
export class SchoolController {
	constructor(private readonly schoolUc: SchoolUc) {}

	@Get('/id/:schoolId')
	@Authenticate('jwt')
	public async getSchoolById(
		@Param() urlParams: SchoolUrlParams,
		@CurrentUser() user: ICurrentUser
	): Promise<SchoolResponse> {
		const res = await this.schoolUc.getSchoolById(urlParams.schoolId, user.userId);

		return res;
	}

	@Get('/list-for-external-invite')
	@Authenticate('jwt')
	public async getSchoolListForExternalInvite(
		@Query() query: SchoolQueryParams,
		@CurrentUser() user: ICurrentUser
	): Promise<SchoolForExternalInviteResponse[]> {
		const res = await this.schoolUc.getSchoolListForExternalInvite(query, user.schoolId);

		return res;
	}

	@Get('/exists/id/:schoolId')
	public async doesSchoolExist(@Param() urlParams: SchoolUrlParams): Promise<SchoolExistsResponse> {
		const result = await this.schoolUc.doesSchoolExist(urlParams.schoolId);

		const res = new SchoolExistsResponse({ exists: result });

		return res;
	}

	@Get('/list-for-login')
	public async getSchoolListForLadpLogin(): Promise<SchoolForLoginResponse[]> {
		const res = await this.schoolUc.getSchoolListForLdapLogin();

		return res;
	}
}
