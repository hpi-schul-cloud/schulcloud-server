import { StrategyType } from '@infra/auth-guard';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContextExternalTool } from '../domain';
import { ContextExternalToolRequestMapper, ContextExternalToolResponseMapper } from '../mapper';
import { AdminApiContextExternalToolUc } from '../uc';
import { ContextExternalToolDto } from '../uc/dto/context-external-tool.types';
import { ContextExternalToolPostParams, ContextExternalToolResponse } from './dto';

@ApiTags('AdminApi: Context External Tool')
@UseGuards(AuthGuard(StrategyType.API_KEY))
@Controller('admin/tools/context-external-tools')
export class AdminApiContextExternalToolController {
	constructor(private readonly adminApiContextExternalToolUc: AdminApiContextExternalToolUc) {}

	@Post()
	@ApiOperation({ summary: 'Creates a ContextExternalTool' })
	async createContextExternalTool(@Body() body: ContextExternalToolPostParams): Promise<ContextExternalToolResponse> {
		const contextExternalToolProps: ContextExternalToolDto =
			ContextExternalToolRequestMapper.mapContextExternalToolRequest(body);

		const contextExternalTool: ContextExternalTool = await this.adminApiContextExternalToolUc.createContextExternalTool(
			contextExternalToolProps
		);

		const response: ContextExternalToolResponse =
			ContextExternalToolResponseMapper.mapContextExternalToolResponse(contextExternalTool);

		return response;
	}
}
