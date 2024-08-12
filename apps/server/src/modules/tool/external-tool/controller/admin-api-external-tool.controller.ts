import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExternalTool } from '../domain';

import { ExternalToolRequestMapper, ExternalToolResponseMapper } from '../mapper';
import { AdminApiExternalToolUc, ExternalToolCreate } from '../uc';
import { ExternalToolCreateParams, ExternalToolResponse } from './dto';

@ApiTags('AdminApi: External Tools')
@UseGuards(AuthGuard('api-key'))
@Controller('admin/tools/external-tools')
export class AdminApiExternalToolController {
	constructor(
		private readonly adminApiExternalToolUc: AdminApiExternalToolUc,
		private readonly externalToolDOMapper: ExternalToolRequestMapper
	) {}

	@Post()
	@ApiOperation({ summary: 'Creates an ExternalTool' })
	async createExternalTool(@Body() externalToolParams: ExternalToolCreateParams): Promise<ExternalToolResponse> {
		const externalTool: ExternalToolCreate = this.externalToolDOMapper.mapCreateRequest(externalToolParams);

		const created: ExternalTool = await this.adminApiExternalToolUc.createExternalTool(externalTool);

		const mapped: ExternalToolResponse = ExternalToolResponseMapper.mapToExternalToolResponse(created);

		return mapped;
	}
}
