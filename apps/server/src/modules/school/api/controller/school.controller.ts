import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { SchoolUc } from '../../domain';
import { SchoolResponseMapper } from './mapper';
import { SchoolQueryParams, SchoolUrlParams } from './param';
import { SlimSchoolListResponse, SchoolResponse } from './response';

@ApiTags('School')
@Authenticate('jwt')
@Controller('school')
export class SchoolController {
	constructor(private readonly schoolUc: SchoolUc) {}

	// TODO: Do we have a convention for the casing of routes?
	@Get('/slim-list')
	public async getSlimSchoolsList(
		@Query() query: SchoolQueryParams,
		@Query() pagination: PaginationParams
	): Promise<SlimSchoolListResponse> {
		// TODO: Think about consistent naming here: What comes first "Slim" or "List"?
		const schools = await this.schoolUc.getListOfSlimSchools(query, pagination);

		const res = SchoolResponseMapper.mapToSlimListResponse(schools, pagination);

		return res;
	}

	@Get('/:schoolId')
	public async getSchool(
		@Param() urlParams: SchoolUrlParams,
		@CurrentUser() user: ICurrentUser
	): Promise<SchoolResponse> {
		const school = await this.schoolUc.getSchool(urlParams.schoolId, user.userId);

		const res = SchoolResponseMapper.mapToResponse(school);

		return res;
	}
}
