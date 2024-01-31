import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminApiSchoolUc } from '../uc/admin-api-schools.uc';
import { AdminApiSchoolMapper } from './admin-api-schools.mapper';
import { AdminApiSchoolCreateBodyParams } from './dto/request/admin-api-school-create.body.params';
import { AdminApiSchoolCreateResponseDto } from './dto/response/admin-api-school-create.response.dto';

@ApiTags('AdminSchool')
@UseGuards(AuthGuard('api-key'))
@Controller('admin/schools')
export class AdminApiSchoolsController {
	constructor(private readonly uc: AdminApiSchoolUc) {}

	@Post('')
	@ApiOperation({
		summary: 'create an empty school',
	})
	async createSchool(@Body() body: AdminApiSchoolCreateBodyParams): Promise<AdminApiSchoolCreateResponseDto> {
		const school = await this.uc.createSchool(body);
		const mapped = AdminApiSchoolMapper.mapSchoolDoToSchoolCreatedResponse(school);

		return Promise.resolve(new AdminApiSchoolCreateResponseDto(mapped));
	}
}
