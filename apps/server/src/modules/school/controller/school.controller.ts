import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { SchoolUc } from '../domain/uc/school.uc';
import { SchoolListResponse, SchoolResponse } from './dto';
import { SchoolUrlParams } from './dto/school-url.params';
import { SchoolDtoMapper } from './mapper';

@ApiTags('School')
@Authenticate('jwt')
@Controller('school')
export class SchoolController {
	constructor(private readonly schoolUc: SchoolUc) {}

	@Get('/')
	public async getAllSchools(@Query() pagination: PaginationParams): Promise<SchoolListResponse> {
		const schools = await this.schoolUc.getAllSchools(pagination);

		const res = SchoolDtoMapper.mapToListResponse(schools);

		return res;
	}

	@Get('/:schoolId')
	public async getSchool(@Param() urlParams: SchoolUrlParams): Promise<SchoolResponse> {
		const school = await this.schoolUc.getSchool(urlParams.schoolId);

		const res = SchoolDtoMapper.mapToResponse(school);

		return res;
	}
}
