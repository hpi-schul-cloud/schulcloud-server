import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { SchoolUc } from '../../domain';
import { SchoolResponseMapper } from './mapper';
import { SchoolQueryParams, SchoolUrlParams } from './param';
import { SchoolListResponse, SchoolResponse } from './response';

@ApiTags('School')
@Authenticate('jwt')
@Controller('school')
export class SchoolController {
	constructor(private readonly schoolUc: SchoolUc) {}

	@Get('/')
	public async getAllSchools(
		@Query() query: SchoolQueryParams,
		@Query() pagination: PaginationParams
	): Promise<SchoolListResponse> {
		const schools = await this.schoolUc.getAllSchools(query, pagination);

		const res = SchoolResponseMapper.mapToListResponse(schools, pagination);

		return res;
	}

	@Get('/:schoolId')
	public async getSchool(@Param() urlParams: SchoolUrlParams): Promise<SchoolResponse> {
		const school = await this.schoolUc.getSchool(urlParams.schoolId);

		const res = SchoolResponseMapper.mapToResponse(school);

		return res;
	}
}
