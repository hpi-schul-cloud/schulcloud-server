import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import { Body, Controller, ForbiddenException, Get, NotFoundException, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { SchoolQueryParams, SchoolUpdateBodyParams, SchoolUrlParams } from './dto/param';
import { SchoolForExternalInviteResponse, SchoolResponse, SchoolSystemResponse } from './dto/response';
import { SchoolExistsResponse } from './dto/response/school-exists.response';
import { SchoolForLdapLoginResponse } from './dto/response/school-for-ldap-login.response';
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
		const res = await this.schoolUc.doesSchoolExist(urlParams.schoolId);

		return res;
	}

	@Get('/list-for-ldap-login')
	public async getSchoolListForLadpLogin(): Promise<SchoolForLdapLoginResponse[]> {
		const res = await this.schoolUc.getSchoolListForLdapLogin();

		return res;
	}

	@ApiOperation({ summary: 'Get systems from school' })
	@ApiResponse({ status: 200, type: SchoolSystemResponse, isArray: true })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@Authenticate('jwt')
	@Get('/:schoolId/systems')
	public async getSchoolSystems(
		@Param() urlParams: SchoolUrlParams,
		@CurrentUser() user: ICurrentUser
	): Promise<SchoolSystemResponse[]> {
		const { schoolId } = urlParams;
		const res = await this.schoolUc.getSchoolSystems(schoolId, user.userId);

		return res;
	}

	@ApiOperation({ summary: 'Updating school props by school administrators' })
	@ApiResponse({ status: 200, type: SchoolResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@Patch('/:schoolId')
	@Authenticate('jwt')
	public async updateSchool(
		@Param() urlParams: SchoolUrlParams,
		@Body() body: SchoolUpdateBodyParams,
		@CurrentUser() user: ICurrentUser
	): Promise<SchoolResponse> {
		const res = await this.schoolUc.updateSchool(user.userId, urlParams.schoolId, body);

		return res;
	}
}
