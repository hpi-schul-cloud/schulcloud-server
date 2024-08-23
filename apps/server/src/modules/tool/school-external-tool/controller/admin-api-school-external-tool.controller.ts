import { ApiKeyGuard } from '@infra/auth-guard';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SchoolExternalTool, SchoolExternalToolProps } from '../domain';
import { SchoolExternalToolRequestMapper, SchoolExternalToolResponseMapper } from '../mapper';
import { AdminApiSchoolExternalToolUc } from '../uc';
import { SchoolExternalToolPostParams, SchoolExternalToolResponse } from './dto';

@ApiTags('AdminApi: School External Tool')
@UseGuards(ApiKeyGuard)
@Controller('admin/tools/school-external-tools')
export class AdminApiSchoolExternalToolController {
	constructor(private readonly adminApiSchoolExternalToolUc: AdminApiSchoolExternalToolUc) {}

	@Post()
	@ApiOperation({ summary: 'Creates a SchoolExternalTool' })
	async createSchoolExternalTool(@Body() body: SchoolExternalToolPostParams): Promise<SchoolExternalToolResponse> {
		const schoolExternalToolProps: SchoolExternalToolProps =
			SchoolExternalToolRequestMapper.mapSchoolExternalToolRequest(body);

		const schoolExternalTool: SchoolExternalTool = await this.adminApiSchoolExternalToolUc.createSchoolExternalTool(
			schoolExternalToolProps
		);

		const response: SchoolExternalToolResponse =
			SchoolExternalToolResponseMapper.mapToSchoolExternalToolResponse(schoolExternalTool);

		return response;
	}
}
