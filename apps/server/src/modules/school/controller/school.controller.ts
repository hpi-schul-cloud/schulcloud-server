import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SchoolUc } from '../domain/uc/school.uc';
import { SchoolListResponse } from './dto';
import { SchoolDtoMapper } from './mapper';

@ApiTags('School')
@Controller('school')
export class SchoolController {
	constructor(private readonly schoolUc: SchoolUc) {}

	@Get('/')
	public async getAllSchools(): Promise<SchoolListResponse> {
		const schools = await this.schoolUc.getAllSchools();

		const res = SchoolDtoMapper.mapToListResponse(schools);

		return res;
	}
}
