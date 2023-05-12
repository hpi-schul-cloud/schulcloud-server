import {
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiResponse,
	ApiTags,
	ApiUnauthorizedResponse,
	ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Body, Controller, Post } from '@nestjs/common';
import { ValidationError } from '@shared/common';
import { ContextExternalToolDO } from '@shared/domain';
import { ICurrentUser } from '@src/modules/authentication';
import { LegacyLogger } from '@src/core/logger';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ContextExternalToolUc } from '../uc';
import { ContextExternalToolRequestMapper, ContextExternalToolResponseMapper } from './mapper';
import { ContextExternalToolPostParams, ContextExternalToolResponse } from './dto';
import { ContextExternalTool } from '../uc/dto';

@ApiTags('Tool')
@Authenticate('jwt')
@Controller('tools/context')
export class ToolContextController {
	constructor(private readonly contextExternalToolUc: ContextExternalToolUc, private readonly logger: LegacyLogger) {}

	@Post()
	@ApiCreatedResponse({
		description: 'The ContextExternalTool has been successfully created.',
		type: ContextExternalToolResponse,
	})
	@ApiForbiddenResponse()
	@ApiUnprocessableEntityResponse()
	@ApiUnauthorizedResponse()
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	async createContextExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() body: ContextExternalToolPostParams
	): Promise<ContextExternalToolResponse> {
		const contextExternalTool: ContextExternalTool =
			ContextExternalToolRequestMapper.mapContextExternalToolRequest(body);

		const createdTool: ContextExternalToolDO = await this.contextExternalToolUc.createContextExternalTool(
			currentUser.userId,
			contextExternalTool
		);

		const response: ContextExternalToolResponse =
			ContextExternalToolResponseMapper.mapContextExternalToolResponse(createdTool);

		this.logger.debug(`ContextExternalTool with id ${response.id} was created by user with id ${currentUser.userId}`);
		return response;
	}
}
