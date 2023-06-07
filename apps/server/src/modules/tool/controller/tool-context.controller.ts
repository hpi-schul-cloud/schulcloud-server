import {
	ApiBearerAuth,
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiOkResponse,
	ApiOperation,
	ApiResponse,
	ApiTags,
	ApiUnauthorizedResponse,
	ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ICurrentUser } from '@src/modules/authentication';
import { LegacyLogger } from '@src/core/logger';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ValidationError } from '@shared/common';
import { ContextExternalToolDO } from '@shared/domain';
import {
	ContextExternalToolIdParams,
	ContextExternalToolPostParams,
	ContextExternalToolResponse,
	ContextExternalToolContextParams,
	ContextExternalToolSearchListResponse,
} from './dto';
import { ContextExternalToolUc } from '../uc';
import { ContextExternalToolRequestMapper, ContextExternalToolResponseMapper } from './mapper';
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
	@ApiOperation({ summary: 'Creates a ContextExternalTool' })
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

	@Delete(':contextExternalToolId')
	@ApiForbiddenResponse()
	@ApiUnauthorizedResponse()
	@ApiOperation({ summary: 'Deletes a ContextExternalTool' })
	async deleteContextExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ContextExternalToolIdParams
	): Promise<void> {
		await this.contextExternalToolUc.deleteContextExternalTool(currentUser.userId, params.contextExternalToolId);

		this.logger.debug(
			`ContextExternalTool with id ${params.contextExternalToolId} was deleted by user with id ${currentUser.userId}`
		);
	}

	@Get(':contextType/:contextId')
	@ApiBearerAuth()
	@ApiForbiddenResponse()
	@ApiUnauthorizedResponse()
	@ApiOkResponse({
		description: 'Returns a list of ContextExternalTools for the given context',
		type: ContextExternalToolSearchListResponse,
	})
	@ApiOperation({ summary: 'Returns a list of ContextExternalTools for the given context' })
	async getContextExternalToolsForContext(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ContextExternalToolContextParams
	): Promise<ContextExternalToolSearchListResponse> {
		const contextExternalTools: ContextExternalTool[] =
			await this.contextExternalToolUc.getContextExternalToolsForContext(
				currentUser.userId,
				params.contextType,
				params.contextId
			);

		const mappedTools: ContextExternalToolResponse[] = contextExternalTools.map(
			(tool: ContextExternalToolDO): ContextExternalToolResponse =>
				ContextExternalToolResponseMapper.mapContextExternalToolResponse(tool)
		);

		this.logger.debug(
			`User with id ${currentUser.userId} fetched ContextExternalTools for contextType: ${params.contextType} and contextId: ${params.contextId}`
		);

		const response: ContextExternalToolSearchListResponse = new ContextExternalToolSearchListResponse(mappedTools);
		return response;
	}
}
