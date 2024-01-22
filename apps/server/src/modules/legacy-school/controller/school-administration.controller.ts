import { Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('AdminSchool')
@UseGuards(AuthGuard('api-key'))
@Controller('admin/schools')
export class AdminSchoolsController {
	// constructor() {}

	@Post()
	@HttpCode(204)
	@ApiOperation({
		summary: 'Execute the deletion process',
	})
	@ApiResponse({
		status: 204,
	})
	async createSchool() {
		return Promise.resolve({});
	}
}
