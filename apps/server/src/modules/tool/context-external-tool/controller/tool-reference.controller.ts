import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Get, Param } from '@nestjs/common';
import { ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ToolReference } from '../domain';
import { ContextExternalToolResponseMapper } from '../mapper';
import { ToolReferenceUc } from '../uc';
import {
	ContextExternalToolContextParams,
	ContextExternalToolIdParams,
	ToolReferenceListResponse,
	ToolReferenceResponse,
} from './dto';

@ApiTags('Tool')
@JwtAuthentication()
@Controller('tools/tool-references')
export class ToolReferenceController {
	constructor(private readonly toolReferenceUc: ToolReferenceUc) {}

	@Get('context-external-tools/:contextExternalToolId')
	@ApiOperation({ summary: 'Get ExternalTool Reference for a given context external tool' })
	@ApiOkResponse({
		description: 'The Tool Reference has been successfully fetched.',
		type: ToolReferenceResponse,
	})
	@ApiForbiddenResponse({ description: 'User is not allowed to access this resource.' })
	@ApiUnauthorizedResponse({ description: 'User is not logged in.' })
	async getToolReference(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ContextExternalToolIdParams
	): Promise<ToolReferenceResponse> {
		const toolReference: ToolReference = await this.toolReferenceUc.getToolReference(
			currentUser.userId,
			params.contextExternalToolId
		);

		const toolReferenceResponse: ToolReferenceResponse =
			ContextExternalToolResponseMapper.mapToToolReferenceResponse(toolReference);

		return toolReferenceResponse;
	}

	@Get('/:contextType/:contextId')
	@ApiOperation({ summary: 'Get ExternalTool References for a given context' })
	@ApiOkResponse({
		description: 'The Tool References has been successfully fetched.',
		type: ToolReferenceListResponse,
	})
	@ApiForbiddenResponse({ description: 'User is not allowed to access this resource.' })
	@ApiUnauthorizedResponse({ description: 'User is not logged in.' })
	async getToolReferencesForContext(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ContextExternalToolContextParams
	): Promise<ToolReferenceListResponse> {
		const toolReferences: ToolReference[] = await this.toolReferenceUc.getToolReferencesForContext(
			currentUser.userId,
			params.contextType,
			params.contextId
		);

		const toolReferenceResponses: ToolReferenceResponse[] =
			ContextExternalToolResponseMapper.mapToToolReferenceResponses(toolReferences);

		const toolReferenceListResponse: ToolReferenceListResponse = new ToolReferenceListResponse(toolReferenceResponses);

		return toolReferenceListResponse;
	}
}
