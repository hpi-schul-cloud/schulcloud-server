import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import {
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiOkResponse,
	ApiOperation,
	ApiResponse,
	ApiTags,
	ApiUnauthorizedResponse,
	ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ValidationError } from '@shared/common';
import { LegacyLogger } from '@src/core/logger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ContextExternalTool } from '../domain';
import { ContextExternalToolRequestMapper, ContextExternalToolResponseMapper } from '../mapper';
import { ContextExternalToolUc } from '../uc';
import { ContextExternalToolDto } from '../uc/dto/context-external-tool.types';
import {
	ContextExternalToolContextParams,
	ContextExternalToolIdParams,
	ContextExternalToolPostParams,
	ContextExternalToolResponse,
	ContextExternalToolSearchListResponse,
} from './dto';
import { ContextExternalToolParams } from './dto/context-external-tool.params';

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
		const contextExternalTool: ContextExternalToolDto =
			ContextExternalToolRequestMapper.mapContextExternalToolRequest(body);

		const createdTool: ContextExternalTool = await this.contextExternalToolUc.createContextExternalTool(
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
			(tool: ContextExternalTool): ContextExternalToolResponse =>
				ContextExternalToolResponseMapper.mapContextExternalToolResponse(tool)
		);

		this.logger.debug(
			`User with id ${currentUser.userId} fetched ContextExternalTools for contextType: ${params.contextType} and contextId: ${params.contextId}`
		);

		const response: ContextExternalToolSearchListResponse = new ContextExternalToolSearchListResponse(mappedTools);
		return response;
	}

	@Get(':contextType/:contextId')
	@ApiForbiddenResponse()
	@ApiUnauthorizedResponse()
	@ApiOkResponse({
		description: 'Returns a ContextExternalTool for the given id and context',
		type: ContextExternalToolResponse,
	})
	@ApiOperation({ summary: 'Returns a ContextExternalTool for the given id and context' })
	async getContextExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ContextExternalToolParams
	): Promise<ContextExternalToolResponse> {
		const contextExternalTool: ContextExternalTool = await this.contextExternalToolUc.getContextExternalTool(
			currentUser.userId,
			params.contextExternalToolId,
			params.contextType,
			params.contextId
		);
		const response: ContextExternalToolResponse =
			ContextExternalToolResponseMapper.mapContextExternalToolResponse(contextExternalTool);

		return response;
	}
}
