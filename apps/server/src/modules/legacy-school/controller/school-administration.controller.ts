import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminApiSchoolUc } from '../uc/school-admin.uc';
import { AdminApiSchoolCreateBodyParams } from './dto/request/admin-api-school-create.body.params';
import { AdminApiSchoolCreateResponseDto } from './dto/response/admin-api-school-create.response.dto';

@ApiTags('AdminSchool')
@UseGuards(AuthGuard('api-key'))
@Controller('admin/schools')
export class AdminSchoolsController {
	constructor(private readonly uc: AdminApiSchoolUc) {}

	@Post('')
	@ApiOperation({
		summary: 'create an empty school',
	})
	async createSchool(@Body() body: AdminApiSchoolCreateBodyParams): Promise<AdminApiSchoolCreateResponseDto> {
		const school = await this.uc.createSchool(body);
		if (school.id === undefined) {
			throw new Error();
		}

		return Promise.resolve(new AdminApiSchoolCreateResponseDto({ id: school.id, name: school.name }));
	}
}
