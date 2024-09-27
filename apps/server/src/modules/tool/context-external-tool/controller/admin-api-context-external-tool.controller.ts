import { ApiKeyGuard } from '@infra/auth-guard';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContextExternalToolRequestMapper, ContextExternalToolResponseMapper } from '../mapper';
import { AdminApiContextExternalToolUc } from '../uc';
import { ContextExternalToolPostParams, ContextExternalToolResponse } from './dto';

@ApiTags('AdminApi: Context External Tool')
@UseGuards(ApiKeyGuard)
@Controller('admin/tools/context-external-tools')
export class AdminApiContextExternalToolController {
	constructor(private readonly adminApiContextExternalToolUc: AdminApiContextExternalToolUc) {}

	@Post()
	@ApiOperation({ summary: 'Creates a ContextExternalTool' })
	async createContextExternalTool(@Body() body: ContextExternalToolPostParams): Promise<ContextExternalToolResponse> {
		const contextExternalToolProps = ContextExternalToolRequestMapper.mapContextExternalToolRequest(body);

		const contextExternalTool = await this.adminApiContextExternalToolUc.createContextExternalTool(
			contextExternalToolProps
		);

		const contextExternalToolResonse =
			ContextExternalToolResponseMapper.mapContextExternalToolResponse(contextExternalTool);

		return contextExternalToolResonse;
	}
}
