import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { SchoolUc } from '../domain/uc/school.uc';
import { SchoolListResponse } from './dto';
import { SchoolDtoMapper } from './mapper';

@ApiTags('School')
@Authenticate('jwt')
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
