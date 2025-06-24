import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import {
	Body,
	Controller,
	ForbiddenException,
	Get,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	Patch,
	Post,
	Query,
} from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiResponse,
	ApiTags,
	ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error';
import {
	MaintenanceResponse,
	SchoolExistsResponse,
	SchoolForExternalInviteListResponse,
	SchoolForLdapLoginResponse,
	SchoolQueryParams,
	SchoolRemoveSystemUrlParams,
	SchoolResponse,
	SchoolSystemResponse,
	SchoolUpdateBodyParams,
	SchoolUrlParams,
	SchoolUserListResponse,
} from './dto';
import { MaintenanceParams } from './dto/maintenance.params';
import { SchoolUc } from './school.uc';

@ApiTags('School')
@Controller('school')
export class SchoolController {
	constructor(private readonly schoolUc: SchoolUc) {}

	@Get('/id/:schoolId')
	@JwtAuthentication()
	public async getSchoolById(
		@Param() urlParams: SchoolUrlParams,
		@CurrentUser() user: ICurrentUser
	): Promise<SchoolResponse> {
		const res = await this.schoolUc.getSchoolById(urlParams.schoolId, user.userId);

		return res;
	}

	@Get('/list-for-external-invite')
	@JwtAuthentication()
	public async getSchoolListForExternalInvite(
		@Query() query: SchoolQueryParams,
		@CurrentUser() user: ICurrentUser
	): Promise<SchoolForExternalInviteListResponse | undefined> {
		const dto = await this.schoolUc.getSchoolListForExternalInvite(
			user.schoolId,
			{
				limit: query.limit,
				skip: query.skip,
			},
			query.federalStateId
		);
		return dto;
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
	@JwtAuthentication()
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
	@JwtAuthentication()
	public async updateSchool(
		@Param() urlParams: SchoolUrlParams,
		@Body() body: SchoolUpdateBodyParams,
		@CurrentUser() user: ICurrentUser
	): Promise<SchoolResponse> {
		const res = await this.schoolUc.updateSchool(user.userId, urlParams.schoolId, body);

		return res;
	}

	@Patch('/:schoolId/system/:systemId/remove')
	@JwtAuthentication()
	public async removeSystemFromSchool(
		@Param() urlParams: SchoolRemoveSystemUrlParams,
		@CurrentUser() user: ICurrentUser
	): Promise<void> {
		await this.schoolUc.removeSystemFromSchool(urlParams.schoolId, urlParams.systemId, user.userId);
	}

	@Get('/:schoolId/teachers')
	@JwtAuthentication()
	public async getTeachers(
		@Param() urlParams: SchoolUrlParams,
		@CurrentUser() user: ICurrentUser
	): Promise<SchoolUserListResponse> {
		const res = await this.schoolUc.getSchoolTeachers(urlParams.schoolId, user.userId);

		return res;
	}

	@Get('/:schoolId/students')
	@JwtAuthentication()
	public async getStudents(
		@Param() urlParams: SchoolUrlParams,
		@CurrentUser() user: ICurrentUser
	): Promise<SchoolUserListResponse> {
		const res = await this.schoolUc.getSchoolStudents(urlParams.schoolId, user.userId);

		return res;
	}

	@Get('/:schoolId/maintenance')
	@ApiOperation({ summary: 'Returns the current maintenance status of the school' })
	@ApiOkResponse({ type: MaintenanceResponse })
	@ApiNotFoundResponse()
	@ApiForbiddenResponse()
	@ApiBadRequestResponse()
	@JwtAuthentication()
	public async getMaintenanceStatus(
		@Param() urlParams: SchoolUrlParams,
		@CurrentUser() user: ICurrentUser
	): Promise<MaintenanceResponse> {
		const response: MaintenanceResponse = await this.schoolUc.getMaintenanceStatus(urlParams.schoolId, user.userId);

		return response;
	}

	@Post('/:schoolId/maintenance')
	@ApiOperation({ summary: 'Sets the school into maintenance or puts it into the next year' })
	@ApiOkResponse({ type: MaintenanceResponse })
	@ApiNotFoundResponse()
	@ApiForbiddenResponse()
	@ApiBadRequestResponse()
	@ApiUnprocessableEntityResponse()
	@JwtAuthentication()
	@HttpCode(HttpStatus.OK)
	public async setMaintenanceStatus(
		@Param() urlParams: SchoolUrlParams,
		@Body() bodyParams: MaintenanceParams,
		@CurrentUser() user: ICurrentUser
	): Promise<MaintenanceResponse> {
		const response: MaintenanceResponse = await this.schoolUc.setMaintenanceStatus(
			urlParams.schoolId,
			user.userId,
			bodyParams.maintenance
		);

		return response;
	}
}
