import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import {
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiResponse,
	ApiTags,
	ApiUnauthorizedResponse,
	ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ValidationError } from '@shared/common';
import { LegacyLogger } from '@src/core/logger';
import { CustomParameterEntry } from '../../common/domain';
import { ContextExternalTool } from '../domain';
import { LtiDeepLink } from '../domain/lti-deep-link';
import { ContextExternalToolRequestMapper, ContextExternalToolResponseMapper } from '../mapper';
import { ContextExternalToolUc } from '../uc';
import { ContextExternalToolDto } from '../uc/dto/context-external-tool.types';
import {
	ContextExternalToolContextParams,
	ContextExternalToolIdParams,
	ContextExternalToolPostParams,
	ContextExternalToolResponse,
	ContextExternalToolSearchListResponse,
	Lti11DeepLinkParams,
} from './dto';
import { Lti11DeepLinkContentItemParams } from './dto/lti11-deep-link/lti11-deep-link-content-item.params';

@ApiTags('Tool')
@Authenticate('jwt')
@Controller('tools/context-external-tools')
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
			currentUser.schoolId,
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
	@HttpCode(HttpStatus.NO_CONTENT)
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

	@Get(':contextExternalToolId')
	@ApiForbiddenResponse()
	@ApiUnauthorizedResponse()
	@ApiNotFoundResponse()
	@ApiOkResponse({
		description: 'Returns a ContextExternalTool for the given id',
		type: ContextExternalToolResponse,
	})
	@ApiOperation({ summary: 'Searches a ContextExternalTool for the given id' })
	async getContextExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ContextExternalToolIdParams
	): Promise<ContextExternalToolResponse> {
		const contextExternalTool: ContextExternalTool = await this.contextExternalToolUc.getContextExternalTool(
			currentUser.userId,
			params.contextExternalToolId
		);

		const response: ContextExternalToolResponse =
			ContextExternalToolResponseMapper.mapContextExternalToolResponse(contextExternalTool);

		return response;
	}

	@Put(':contextExternalToolId')
	@ApiOkResponse({
		description: 'The ContextExternalTool has been successfully updated.',
		type: ContextExternalToolResponse,
	})
	@ApiForbiddenResponse()
	@ApiUnauthorizedResponse()
	@ApiUnprocessableEntityResponse()
	@ApiOperation({ summary: 'Updates a ContextExternalTool' })
	async updateContextExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ContextExternalToolIdParams,
		@Body() body: ContextExternalToolPostParams
	): Promise<ContextExternalToolResponse> {
		const contextExternalTool: ContextExternalToolDto =
			ContextExternalToolRequestMapper.mapContextExternalToolRequest(body);

		const updatedTool: ContextExternalTool = await this.contextExternalToolUc.updateContextExternalTool(
			currentUser.userId,
			currentUser.schoolId,
			params.contextExternalToolId,
			contextExternalTool
		);

		const response: ContextExternalToolResponse =
			ContextExternalToolResponseMapper.mapContextExternalToolResponse(updatedTool);

		return response;
	}

	@Post(':contextExternalToolId/lti11-deep-link-callback')
	async lti11(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ContextExternalToolIdParams,
		@Body() body: Lti11DeepLinkParams
	): Promise<void> {
		const deepLink: LtiDeepLink | undefined = ToolContextController.mapToDeepLink(body);

		await this.contextExternalToolUc.updateLtiDeepLink(currentUser.userId, params.contextExternalToolId, deepLink);
	}

	private static mapToDeepLink(body: Lti11DeepLinkParams): LtiDeepLink | undefined {
		const contentItem: Lti11DeepLinkContentItemParams | undefined = body.content_items?.['@graph'][0];

		let parameters: CustomParameterEntry[] = [];
		if (contentItem?.custom) {
			parameters = Object.keys(contentItem.custom).map(
				(key: string) => new CustomParameterEntry({ name: key, value: contentItem.custom?.[key] })
			);
		}

		const deepLink: LtiDeepLink | undefined = contentItem
			? new LtiDeepLink({
					mediaType: contentItem.mediaType,
					url: contentItem.url,
					title: contentItem.title,
					text: contentItem.text,
					parameters,
					availableFrom: contentItem.available?.startDatetime,
					availableUntil: contentItem.available?.endDatetime,
					submissionFrom: contentItem.submission?.startDatetime,
					submissionUntil: contentItem.submission?.endDatetime,
			  })
			: undefined;

		return deepLink;
	}
}
