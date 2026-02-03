import { XApiKeyAuthentication } from '@infra/auth-guard';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExternalToolRequestMapper, ExternalToolResponseMapper } from '../mapper';
import { AdminApiExternalToolUc } from '../uc';
import { ExternalToolCreateParams, ExternalToolResponse } from './dto';

@ApiTags('AdminApi: External Tools')
@XApiKeyAuthentication()
@Controller('admin/tools/external-tools')
export class AdminApiExternalToolController {
	constructor(
		private readonly adminApiExternalToolUc: AdminApiExternalToolUc,
		private readonly externalToolDOMapper: ExternalToolRequestMapper
	) {}

	@Post()
	@ApiOperation({ summary: 'Creates an ExternalTool' })
	public async createExternalTool(@Body() externalToolParams: ExternalToolCreateParams): Promise<ExternalToolResponse> {
		const externalToolCreateParams = this.externalToolDOMapper.mapCreateRequest(externalToolParams);
		const externalTool = await this.adminApiExternalToolUc.createExternalTool(externalToolCreateParams);

		const externalToolResponse = ExternalToolResponseMapper.mapToExternalToolResponse(externalTool);

		return externalToolResponse;
	}
}
